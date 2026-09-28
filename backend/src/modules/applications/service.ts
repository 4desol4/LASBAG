import {
  RequirementStatus,
  ApplicationStatus,
  STAGES,
  projectAnswersSchema,
  type ProjectAnswers,
  type StageKey,
} from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { applicableRequirementIds } from "../requirements/engine.js";
import { computeJourney } from "../workflow/stages.js";

const versionMeta = {
  id: true,
  version: true,
  originalName: true,
  mimeType: true,
  fileSize: true,
  status: true,
  rejectionReason: true,
  uploadedAt: true,
  verifiedAt: true,
} as const;

export async function evaluateRequirements(answers: ProjectAnswers) {
  const defs = await prisma.requirementDefinition.findMany({
    include: { rules: true, agency: true },
    orderBy: { code: "asc" },
  });
  const ids = new Set(
    applicableRequirementIds(
      defs.flatMap((d) =>
        d.rules.map((r) => ({
          id: r.id,
          requirementDefinitionId: d.id,
          condition: r.condition as any,
          active: r.active,
        })),
      ),
      answers,
    ),
  );
  return defs
    .filter((d) => ids.has(d.id))
    .sort((a, b) => order(a.stage) - order(b.stage));
}
const order = (k: string) => STAGES.find((s) => s.key === k)!.order;

export async function nextReference(year = new Date().getFullYear()) {
  const prefix = `LASBAG-DEV-${year}-`;
  const last = await prisma.application.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  return (
    prefix +
    String(
      (last ? Number(last.reference.slice(prefix.length)) : 0) + 1,
    ).padStart(5, "0")
  );
}

/** Re-evaluates the rules for a draft: adds newly applicable requirements, marks no-longer-applicable ones NOT_REQUIRED. Verified work is never touched. */
export async function syncRequirements(
  applicationId: string,
  answers: ProjectAnswers,
) {
  const applicable = await evaluateRequirements(answers);
  const keep = new Set(applicable.map((d) => d.id));
  await prisma.$transaction([
    ...applicable.map((d) =>
      prisma.applicationRequirement.upsert({
        where: {
          applicationId_definitionId: { applicationId, definitionId: d.id },
        },
        create: {
          applicationId,
          definitionId: d.id,
          status: RequirementStatus.REQUIRED,
        },
        update: {},
      }),
    ),
    prisma.applicationRequirement.updateMany({
      where: {
        applicationId,
        definitionId: { notIn: [...keep] },
        status: RequirementStatus.REQUIRED,
      },
      data: { status: RequirementStatus.NOT_REQUIRED },
    }),
  ]);
}

/** Server-side SLA state. */
export function slaState(
  s: { startTime: Date; dueTime: Date; completedTime: Date | null },
  now = new Date(),
) {
  if (s.completedTime) return { state: "COMPLETED", secondsLeft: 0 };
  const left = Math.round((s.dueTime.getTime() - now.getTime()) / 1000);
  const total = (s.dueTime.getTime() - s.startTime.getTime()) / 1000;
  return {
    state: left < 0 ? "OVERDUE" : left < total * 0.25 ? "DUE_SOON" : "ON_TRACK",
    secondsLeft: left,
  };
}

/** Persist derived stage/progress so lists and the MDA queue can filter on them. */
export async function recompute(applicationId: string) {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { requirements: { include: { definition: true } } },
  });
  const j = computeJourney(
    app.requirements.map((r) => ({
      stage: r.definition.stage as StageKey,
      mandatory: r.definition.mandatory,
      status: r.status,
    })),
  );
  const done = j.stages.every((s) => s.state === "COMPLETED");
  await prisma.$transaction([
    ...j.stages.map((s) =>
      prisma.applicationStage.upsert({
        where: { applicationId_stage: { applicationId, stage: s.key } },
        create: { applicationId, stage: s.key, state: s.state as any },
        update: { state: s.state as any },
      }),
    ),
    prisma.application.update({
      where: { id: applicationId },
      data: {
        currentStage: (j.currentStage ?? "COMPLETION") as any,
        progress: app.status === "DRAFT" ? 0 : j.progress,
      },
    }),
  ]);
}

export async function getDetail(id: string) {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id },
    include: {
      project: true,
      applicant: {
        select: { firstName: true, lastName: true, email: true, role: true },
      },
      requirements: {
        include: {
          definition: { include: { agency: true } },
          sla: true,
          comments: true,
          documents: {
            include: {
              versions: { select: versionMeta, orderBy: { version: "desc" } },
            },
          },
        },
      },
      tasks: { include: { agency: true, sla: true } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  const reqs = app.requirements
    .filter((r) => r.status !== "NOT_REQUIRED")
    .sort((a, b) => order(a.definition.stage) - order(b.definition.stage));
  const journey = computeJourney(
    app.requirements.map((r) => ({
      stage: r.definition.stage as StageKey,
      mandatory: r.definition.mandatory,
      status: r.status,
    })),
  );
  const requirements = reqs.map((r) => ({
    ...r,
    sla: r.sla && { ...r.sla, ...slaState(r.sla) },
  }));
  return {
    ...app,
    requirements,
    journey,
    tasks: app.tasks.map((t) => ({
      ...t,
      sla: t.sla && { ...t.sla, ...slaState(t.sla) },
    })),
    nextAction: nextAction(app.status, requirements),
  };
}

function nextAction(status: string, reqs: any[]) {
  if (status === ApplicationStatus.COMPLETED) return null; // UI shows "Approval Journey Completed"
  if (status === ApplicationStatus.DRAFT)
    return {
      kind: "CONTINUE",
      title: "Tell us about your development",
      cta: "Continue application",
    };
  const r =
    reqs.find((x) => x.status === "ACTION_NEEDED") ??
    reqs.find((x) => x.status === "REQUIRED");
  if (!r)
    return {
      kind: "WAIT",
      title: "Your application is currently under review",
      cta: "View details",
    };
  return {
    kind: "UPLOAD",
    requirementId: r.id,
    title:
      r.status === "ACTION_NEEDED"
        ? `Provide additional ${r.definition.name.toLowerCase()} information`
        : `Submit ${r.definition.name}`,
    reason: r.statusReason,
    dueTime: r.sla?.dueTime ?? null,
    sla: r.sla ? { state: r.sla.state, secondsLeft: r.sla.secondsLeft } : null,
    cta: "Upload document",
  };
}
export { projectAnswersSchema };
