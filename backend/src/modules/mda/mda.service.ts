import type { Request } from "express";
import { STAGES } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { notify, notifyRole } from "../notifications/notification.service.js";
import { recompute, getDetail, slaState } from "../applications/service.js";
import {
  approvalBlockers,
  nextApplicationStatus,
  type Decision,
} from "./rules.js";

const DAY = 864e5;
export const tabWhere = (
  tab: string,
  now = new Date(),
): Record<string, unknown> => {
  const filters: Record<string, Record<string, unknown>> = {
    new: { status: "SUBMITTED" },
    in_review: { status: "IN_REVIEW" },
    waiting: { status: "ACTION_REQUIRED" },
    completed: { status: "COMPLETED" },
    overdue: {
      tasks: {
        some: {
          status: { not: "COMPLETED" },
          sla: { is: { completedTime: null, dueTime: { lt: now } } },
        },
      },
    },
    due_soon: {
      tasks: {
        some: {
          status: { not: "COMPLETED" },
          sla: {
            is: {
              completedTime: null,
              dueTime: { gte: now, lt: new Date(now.getTime() + 2 * DAY) },
            },
          },
        },
      },
    },
  };
  return filters[tab] ?? {};
};

/** Officers see only applications with a task for their agency; admins see all. Drafts are never visible to reviewers. */
export const scopeFor = (u: { role: string; agencyId?: string | null }) => ({
  status: { not: "DRAFT" },
  ...(u.role === "MDA_OFFICER"
    ? { tasks: { some: { agencyId: u.agencyId ?? "none" } } }
    : {}),
});

export async function queue(
  u: { role: string; agencyId?: string | null },
  q: {
    tab: string;
    q?: string;
    page: number;
    pageSize: number;
    sort: string;
    dir: string;
  },
) {
  const base = scopeFor(u) as any;
  const now = new Date();
  const where = {
    AND: [
      base,
      tabWhere(q.tab, now),
      q.q
        ? {
            OR: [
              { reference: { contains: q.q, mode: "insensitive" } },
              { project: { title: { contains: q.q, mode: "insensitive" } } },
              {
                applicant: { lastName: { contains: q.q, mode: "insensitive" } },
              },
            ],
          }
        : {},
    ],
  };
  const tabs = [
    "new",
    "in_review",
    "waiting",
    "due_soon",
    "overdue",
    "completed",
  ];
  const [total, rows, all, ...counts] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      orderBy: { [q.sort]: q.dir },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: {
        project: { select: { title: true } },
        applicant: { select: { firstName: true, lastName: true } },
        tasks: {
          where: {
            status: { not: "COMPLETED" },
            ...(u.agencyId && u.role === "MDA_OFFICER"
              ? { agencyId: u.agencyId }
              : {}),
          },
          include: { sla: true },
        },
      },
    }),
    prisma.application.count({ where: base }),
    ...tabs.map((t) =>
      prisma.application.count({ where: { AND: [base, tabWhere(t, now)] } }),
    ),
  ]);
  const items = rows.map((a) => {
    const s = a.tasks
      .map((t) => t.sla)
      .filter(Boolean)
      .sort((x, y) => +x!.dueTime - +y!.dueTime)[0];
    return {
      id: a.id,
      reference: a.reference,
      status: a.status,
      currentStage: a.currentStage,
      progress: a.progress,
      projectTitle: a.project?.title,
      applicantName: `${a.applicant.firstName} ${a.applicant.lastName}`,
      sla: s ? slaState(s) : null,
    };
  });
  return {
    items,
    total,
    counts: { all, ...Object.fromEntries(tabs.map((t, i) => [t, counts[i]])) },
  };
}

export async function reviewDetail(id: string) {
  const [detail, history] = await Promise.all([
    getDetail(id),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entity: "Application", entityId: id },
          {
            entity: "Document",
            entityId: {
              in: (
                await prisma.document.findMany({
                  where: { applicationId: id },
                  select: { id: true },
                })
              ).map((d) => d.id),
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return { ...detail, history };
}

export async function startReview(req: Request, id: string) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id } });
  if (app.status !== "SUBMITTED") return;
  await prisma.application.update({
    where: { id },
    data: { status: "IN_REVIEW" },
  });
  await prisma.applicationEvent.create({
    data: {
      applicationId: id,
      actorId: req.user!.id,
      actorRole: req.user!.role as any,
      type: "MDA_REVIEW_STARTED",
      description: "Review started",
    },
  });
  await audit(req, {
    action: "MDA_REVIEW_STARTED",
    entity: "Application",
    entityId: id,
    previousStatus: "SUBMITTED",
    newStatus: "IN_REVIEW",
  });
}

export async function decide(
  req: Request,
  id: string,
  action: Decision,
  input: { reason: string; comments?: string; requirementId?: string },
) {
  const u = req.user!;
  const agencyId = u.role === "MDA_OFFICER" ? (u.agencyId ?? null) : null;
  const app = await prisma.application.findUniqueOrThrow({
    where: { id },
    include: { requirements: { include: { definition: true } }, tasks: true },
  });
  if (["DRAFT", "COMPLETED", "CANCELLED"].includes(app.status))
    throw new AppError(409, "This application isn't open for review.");
  const mine = app.requirements.filter(
    (r) =>
      r.status !== "NOT_REQUIRED" &&
      (!agencyId || r.definition.agencyId === agencyId),
  );
  const prev = app.status;
  const link = `/applications/${id}`;
  let title = "",
    body = "",
    eventText = "";

  if (action === "approve") {
    const stageReqs = mine.filter(
      (r) => r.definition.stage === app.currentStage,
    );
    if (!stageReqs.length)
      throw new AppError(
        409,
        "There is nothing for your agency to approve at this stage.",
      );
    const blockers = approvalBlockers(
      stageReqs.map((r) => ({ status: r.status, name: r.definition.name })),
    );
    if (blockers.length)
      throw new AppError(409, `Resolve these first: ${blockers.join(", ")}.`);
    await prisma.$transaction(async (tx) => {
      await tx.applicationRequirement.updateMany({
        where: { id: { in: stageReqs.map((r) => r.id) } },
        data: { status: "VERIFIED", statusReason: null },
      });
      for (const r of stageReqs) {
        // verify the latest version of each document
        const docs = await tx.document.findMany({
          where: { requirementId: r.id },
          include: { versions: { orderBy: { version: "desc" }, take: 1 } },
        });
        for (const d of docs)
          if (
            d.versions[0] &&
            ["UPLOADED", "UNDER_REVIEW"].includes(d.versions[0].status)
          )
            await tx.documentVersion.update({
              where: { id: d.versions[0].id },
              data: { status: "VERIFIED", verifiedAt: new Date() },
            });
      }
      const mineTasks = app.tasks.filter(
        (t) =>
          t.stage === app.currentStage &&
          (!agencyId || t.agencyId === agencyId),
      );
      await tx.agencyTask.updateMany({
        where: { id: { in: mineTasks.map((t) => t.id) } },
        data: { status: "COMPLETED" },
      });
      await tx.sLA.updateMany({
        where: { taskId: { in: mineTasks.map((t) => t.id) } },
        data: { completedTime: new Date() },
      });
    });
    eventText = "Review completed for this stage";
  } else if (action === "clarification") {
    const r = mine.find((x) => x.id === input.requirementId);
    if (!r)
      throw new AppError(
        400,
        "Choose the requirement that needs more information.",
      );
    await prisma.$transaction([
      prisma.applicationRequirement.update({
        where: { id: r.id },
        data: { status: "ACTION_NEEDED", statusReason: input.reason },
      }), // only this requirement changes
      prisma.sLA.upsert({
        where: { requirementId: r.id },
        create: {
          requirementId: r.id,
          startTime: new Date(),
          dueTime: new Date(Date.now() + 7 * DAY),
        },
        update: {
          startTime: new Date(),
          dueTime: new Date(Date.now() + 7 * DAY),
          completedTime: null,
        },
      }),
      prisma.agencyTask.updateMany({
        where: {
          applicationId: id,
          agencyId: r.definition.agencyId,
          stage: r.definition.stage,
          status: { not: "COMPLETED" },
        },
        data: { status: "WAITING" },
      }),
    ]);
    title = "Additional information is required";
    body = `${r.definition.name}: ${input.reason}`;
    eventText = `Additional information requested: ${r.definition.name}`;
  } else if (action === "return")
    eventText = "Application returned for correction";
  else {
    // escalate
    await prisma.agencyTask.updateMany({
      where: {
        applicationId: id,
        ...(agencyId ? { agencyId } : {}),
        status: { not: "COMPLETED" },
        stage: app.currentStage,
      },
      data: { status: "ESCALATED" },
    });
    await notifyRole("ADMIN", {
      title: "Application escalated",
      body: `${app.reference}: ${input.reason}`,
      link,
    });
    eventText = "Application escalated for senior review";
  }

  await recompute(id);
  const fresh = await prisma.application.findUniqueOrThrow({
    where: { id },
    include: { stages: true },
  });
  const allDone = fresh.stages.every((s) => s.state === "COMPLETED");
  const status = nextApplicationStatus(action, allDone, prev);
  await prisma.application.update({
    where: { id },
    data: {
      status: status as any,
      completedAt: status === "COMPLETED" ? new Date() : undefined,
      progress: status === "COMPLETED" ? 100 : fresh.progress,
    },
  });
  if (action === "approve" && !allDone)
    // unlock the next stage: queued tasks for the new current stage start
    await prisma.agencyTask.updateMany({
      where: { applicationId: id, stage: fresh.currentStage, status: "QUEUED" },
      data: { status: "IN_PROGRESS" },
    });
  if (action === "approve") {
    title = allDone
      ? "Approval journey completed"
      : "Your application has moved forward";
    body = allDone
      ? "Your development approval journey has been completed successfully."
      : `${STAGES.find((s) => s.key === app.currentStage)!.label} is complete. Next: ${STAGES.find((s) => s.key === fresh.currentStage)!.label}.`;
  }
  if (action === "return") {
    title = "Your application needs correction";
    body = input.reason;
  }
  await prisma.applicationEvent.create({
    data: {
      applicationId: id,
      actorId: u.id,
      actorRole: u.role as any,
      type: `APPLICATION_${action.toUpperCase()}`,
      description: eventText,
    },
  });
  const code = {
    approve: "APPLICATION_APPROVED",
    clarification: "CLARIFICATION_REQUESTED",
    return: "APPLICATION_RETURNED",
    escalate: "APPLICATION_ESCALATED",
  }[action];
  await audit(req, {
    action: code,
    entity: "Application",
    entityId: id,
    previousStatus: prev,
    newStatus: status,
    reason: input.reason,
    metadata: { comments: input.comments, requirementId: input.requirementId },
  });
  if (title) await notify({ userId: app.applicantId, title, body, link });
  return getDetail(id);
}

/** Called after an applicant uploads against a requirement: only that requirement returns to review; the journey is not restarted. */
export async function afterApplicantResponse(applicationId: string) {
  const open = await prisma.applicationRequirement.count({
    where: { applicationId, status: "ACTION_NEEDED" },
  });
  if (open) return;
  await prisma.application.updateMany({
    where: { id: applicationId, status: "ACTION_REQUIRED" },
    data: { status: "IN_REVIEW" },
  });
  await prisma.agencyTask.updateMany({
    where: { applicationId, status: "WAITING" },
    data: { status: "IN_PROGRESS" },
  });
}
