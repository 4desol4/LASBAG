import { Router } from "express";
import { z } from "zod";
import {
  apiOk,
  ApplicationStatus,
  RequirementStatus,
  projectAnswersSchema,
} from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, wrap } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { authenticate } from "../../middleware/auth.js";
import { assertApplicationAccess } from "../documents/access.js";
import {
  evaluateRequirements,
  getDetail,
  nextReference,
  recompute,
  syncRequirements,
} from "./service.js";

export const applicationsRouter = Router();
applicationsRouter.use(authenticate);

const brief = (d: any) => ({
  id: d.id,
  code: d.code,
  name: d.name,
  description: d.description,
  mandatory: d.mandatory,
  stage: d.stage,
  documentType: d.documentType,
  agency: d.agency?.code,
});
// Live checklist for the LASBAG assistant. Partial answers are fine; unanswered fields simply don't match rules.
applicationsRouter.post(
  "/requirements/evaluate",
  wrap(async (req, res) => {
    const a = projectAnswersSchema.partial().parse(req.body);
    res.json(
      apiOk(
        (
          await evaluateRequirements({
            floors: 1,
            isNewDevelopment: true,
            nearWaterOrDrainage: false,
            nearAirport: false,
            developmentType: "OTHER",
            location: "",
            ...a,
          })
        ).map(brief),
      ),
    );
  }),
);

const listQuery = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  status: z.nativeEnum(ApplicationStatus as any).optional(),
  q: z.string().optional(),
  sort: z.enum(["updatedAt", "createdAt", "progress"]).default("updatedAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
applicationsRouter.get(
  "/applications",
  wrap(async (req, res) => {
    const q = listQuery.parse(req.query);
    const where: any = {
      applicantId: req.user!.id,
      ...(q.status && { status: q.status }),
      ...(q.q && {
        OR: [
          { reference: { contains: q.q, mode: "insensitive" } },
          { project: { title: { contains: q.q, mode: "insensitive" } } },
        ],
      }),
    };
    const [total, items] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          project: {
            select: { title: true, siteAddress: true, developmentType: true },
          },
        },
        orderBy: { [q.sort]: q.dir },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    res.json(apiOk({ items, total, page: q.page, pageSize: q.pageSize }));
  }),
);

const createSchema = z.object({
  title: z.string().min(3).default("Untitled development"),
  siteAddress: z.string().default(""),
  answers: projectAnswersSchema.partial().default({}),
});
applicationsRouter.post(
  "/applications",
  wrap(async (req, res) => {
    const d = createSchema.parse(req.body);
    for (let attempt = 0; ; attempt++) {
      // retry on a reference collision
      try {
        const app = await prisma.application.create({
          data: {
            reference: await nextReference(),
            applicantId: req.user!.id,
            project: {
              create: {
                title: d.title,
                siteAddress: d.siteAddress,
                developmentType: d.answers.developmentType ?? "OTHER",
                floors: d.answers.floors,
                answers: d.answers,
              },
            },
          },
        });
        await audit(req, {
          action: "APPLICATION_CREATED",
          entity: "Application",
          entityId: app.id,
        });
        return res.status(201).json(apiOk(app, "Application started"));
      } catch (e: any) {
        if (e.code !== "P2002" || attempt > 2) throw e;
      }
    }
  }),
);

applicationsRouter.get(
  "/applications/:id",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    res.json(apiOk(await getDetail(req.params.id)));
  }),
);
applicationsRouter.get(
  "/applications/:id/requirements",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    res.json(apiOk((await getDetail(req.params.id)).requirements));
  }),
);
applicationsRouter.get(
  "/applications/:id/timeline",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    res.json(
      apiOk(
        await prisma.applicationEvent.findMany({
          where: { applicationId: req.params.id },
          orderBy: { createdAt: "asc" },
        }),
      ),
    );
  }),
);

applicationsRouter.patch(
  "/applications/:id",
  wrap(async (req, res) => {
    const app = await assertApplicationAccess(req.user!, req.params.id);
    if (app.status !== "DRAFT" || app.applicantId !== req.user!.id)
      throw new AppError(409, "Only draft applications can be edited.");
    const d = z
      .object({
        title: z.string().min(3).optional(),
        siteAddress: z.string().optional(),
        answers: projectAnswersSchema.partial(),
      })
      .parse(req.body);
    const prev = (
      await prisma.project.findUniqueOrThrow({
        where: { applicationId: app.id },
      })
    ).answers as object;
    const merged = { ...prev, ...d.answers };
    await prisma.project.update({
      where: { applicationId: app.id },
      data: {
        title: d.title,
        siteAddress: d.siteAddress,
        developmentType: (merged as any).developmentType,
        floors: (merged as any).floors,
        answers: merged,
      },
    });
    const full = projectAnswersSchema.safeParse(merged);
    if (full.success) {
      await syncRequirements(app.id, full.data);
      await recompute(app.id);
    } // rules run on the server only
    res.json(apiOk(await getDetail(app.id), "Saved"));
  }),
);

applicationsRouter.post(
  "/applications/:id/submit",
  wrap(async (req, res) => {
    const app = await assertApplicationAccess(req.user!, req.params.id);
    if (app.status !== "DRAFT" || app.applicantId !== req.user!.id)
      throw new AppError(409, "This application has already been submitted.");
    const d = await getDetail(app.id);
    if (
      !projectAnswersSchema.safeParse(d.project?.answers).success ||
      !d.requirements.length
    )
      throw new AppError(409, "Please describe your development first.");
    const missing = d.requirements
      .filter(
        (r) =>
          r.definition.stage === "SUBMISSION" &&
          r.definition.mandatory &&
          !r.documents.length,
      )
      .map((r) => r.definition.name);
    if (missing.length)
      throw new AppError(409, `Please upload: ${missing.join(", ")}.`);
    await prisma.$transaction(async (tx) => {
      for (const r of d.requirements.filter(
        (x) => x.definition.stage === "SUBMISSION",
      ))
        await tx.applicationRequirement.update({
          where: { id: r.id },
          data: { status: RequirementStatus.SUBMITTED },
        });
      const seen = new Set<string>();
      for (const r of d.requirements) {
        // orchestration: one task per agency per stage
        const k = r.definition.agencyId + r.definition.stage;
        if (seen.has(k)) continue;
        seen.add(k);
        await tx.agencyTask.create({
          data: {
            applicationId: app.id,
            agencyId: r.definition.agencyId,
            stage: r.definition.stage,
            title: `${r.definition.agency.name}: ${r.definition.stage.replace("_", " ").toLowerCase()}`,
            status: "QUEUED",
          },
        });
      }
      await tx.application.update({
        where: { id: app.id },
        data: { status: ApplicationStatus.SUBMITTED, submittedAt: new Date() },
      });
      await tx.applicationEvent.create({
        data: {
          applicationId: app.id,
          actorId: req.user!.id,
          actorRole: req.user!.role as any,
          type: "APPLICATION_SUBMITTED",
          description: "Application submitted and received by LASBAG",
        },
      });
      await tx.notification.create({
        data: {
          userId: req.user!.id,
          title: "Application received",
          body: `${app.reference} has been submitted.`,
          link: `/applications/${app.id}`,
        },
      });
    });
    await recompute(app.id);
    await audit(req, {
      action: "APPLICATION_SUBMITTED",
      entity: "Application",
      entityId: app.id,
      previousStatus: "DRAFT",
      newStatus: "SUBMITTED",
    });
    res.json(apiOk(await getDetail(app.id), "Application submitted"));
  }),
);
