import { Router } from "express";
import { apiOk } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { wrap } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";

/** Cross-application document library for the signed-in applicant. Metadata only; fileData is never selected. */
export const documentLibraryRouter = Router();
documentLibraryRouter.use(authenticate);
documentLibraryRouter.get(
  "/documents",
  wrap(async (req, res) => {
    const docs = await prisma.document.findMany({
      where: { application: { applicantId: req.user!.id } },
      include: {
        application: {
          select: {
            id: true,
            reference: true,
            project: { select: { title: true } },
          },
        },
        requirement: {
          select: {
            id: true,
            status: true,
            definition: { select: { name: true } },
          },
        },
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            originalName: true,
            mimeType: true,
            fileSize: true,
            status: true,
            rejectionReason: true,
            uploadedAt: true,
          },
        },
      },
      take: 500,
    });
    const items = docs
      .map((d) => ({
        id: d.id,
        documentType: d.documentType,
        applicationId: d.application.id,
        reference: d.application.reference,
        projectTitle: d.application.project?.title ?? null,
        requirementId: d.requirementId,
        requirementName: d.requirement?.definition.name ?? null,
        requirementStatus: d.requirement?.status ?? null,
        latest: d.versions[0] ?? null,
        versionCount: d.versions.length,
      }))
      .filter((d) => d.latest)
      .sort(
        (a, b) =>
          +new Date(b.latest!.uploadedAt) - +new Date(a.latest!.uploadedAt),
      );
    res.json(apiOk({ items }));
  }),
);
