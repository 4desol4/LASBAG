import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  apiOk,
  DocumentStatus,
  RequirementStatus,
} from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, wrap } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { storage } from "../../storage/storage.js";
import { afterApplicantResponse } from "../mda/mda.service.js";
import { assertApplicationAccess } from "./access.js";
import { MAX_BYTES, validateUpload } from "./validate.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
});
export const documentsRouter = Router();
documentsRouter.use(authenticate);
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
} as const; // fileData deliberately excluded

// Upload or replace: same application + type (+ requirement) gets a NEW VERSION; earlier versions are kept.
documentsRouter.post(
  "/applications/:id/documents",
  upload.single("file"),
  wrap(async (req, res) => {
    const app = await assertApplicationAccess(req.user!, req.params.id);
    if (!req.file) throw new AppError(400, "Please choose a file to upload.");
    const { documentType, requirementId } = z
      .object({
        documentType: z.string().min(2),
        requirementId: z.string().uuid().optional(),
      })
      .parse(req.body);
    const f = validateUpload(req.file);
    const { data } = await storage.put({ data: req.file.buffer });
    const result = await prisma.$transaction(async (tx) => {
      let doc = await tx.document.findFirst({
        where: {
          applicationId: app.id,
          documentType,
          requirementId: requirementId ?? null,
        },
      });
      doc ??= await tx.document.create({
        data: {
          applicationId: app.id,
          documentType,
          requirementId,
          uploadedById: req.user!.id,
        },
      });
      const last = await tx.documentVersion.aggregate({
        where: { documentId: doc.id },
        _max: { version: true },
      });
      const v = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: (last._max.version ?? 0) + 1,
          originalName: f.name,
          mimeType: f.mime,
          fileSize: req.file!.size,
          fileData: data,
          uploadedById: req.user!.id,
        },
        select: versionMeta,
      });
      if (requirementId)
        // clarification flow: only this requirement returns to review
        await tx.applicationRequirement.update({
          where: { id: requirementId },
          data: { status: RequirementStatus.UNDER_REVIEW, statusReason: null },
        });
      return { documentId: doc.id, ...v };
    });
    if (requirementId) await afterApplicantResponse(app.id);
    await audit(req, {
      action: "DOCUMENT_UPLOADED",
      entity: "Document",
      entityId: result.documentId,
      metadata: { version: result.version, documentType },
    });
    res.status(201).json(apiOk(result, "Document uploaded"));
  }),
);

documentsRouter.get(
  "/documents/:id",
  wrap(async (req, res) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: {
        versions: { select: versionMeta, orderBy: { version: "desc" } },
      },
    });
    if (!doc) throw new AppError(404, "Document not found.");
    await assertApplicationAccess(req.user!, doc.applicationId);
    res.json(apiOk(doc));
  }),
);

documentsRouter.get(
  "/documents/:id/download",
  wrap(async (req, res) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) throw new AppError(404, "Document not found.");
    await assertApplicationAccess(req.user!, doc.applicationId);
    const version = req.query.version ? Number(req.query.version) : undefined;
    const v = await prisma.documentVersion.findFirst({
      where: { documentId: doc.id, ...(version ? { version } : {}) },
      orderBy: { version: "desc" },
    });
    if (!v) throw new AppError(404, "Document not found.");
    await audit(req, {
      action: "DOCUMENT_DOWNLOADED",
      entity: "Document",
      entityId: doc.id,
      metadata: { version: v.version },
    });
    const disp = req.query.preview === "1" ? "inline" : "attachment";
    res
      .set({
        "Content-Type": v.mimeType,
        "Content-Length": String(v.fileSize),
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `${disp}; filename="${encodeURIComponent(v.originalName)}"`,
      })
      .end(Buffer.from(v.fileData));
  }),
);

const decision = z
  .object({
    version: z.number().int().positive(),
    status: z.enum([DocumentStatus.VERIFIED, DocumentStatus.REJECTED]),
    rejectionReason: z.string().min(3).optional(),
  })
  .refine((d) => d.status !== "REJECTED" || !!d.rejectionReason, {
    message: "A reason is required when rejecting a document.",
  });
documentsRouter.patch(
  "/documents/:id",
  authorize("MDA_OFFICER", "ADMIN", "SUPER_ADMIN"),
  wrap(async (req, res) => {
    const d = decision.parse(req.body);
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
    });
    if (!doc) throw new AppError(404, "Document not found.");
    await assertApplicationAccess(req.user!, doc.applicationId);
    const key = {
      documentId_version: { documentId: doc.id, version: d.version },
    };
    const prev = await prisma.documentVersion.findUniqueOrThrow({
      where: key,
      select: { status: true },
    });
    const v = await prisma.documentVersion.update({
      where: key,
      data: {
        status: d.status,
        rejectionReason: d.rejectionReason,
        verifiedAt: d.status === "VERIFIED" ? new Date() : null,
      },
      select: versionMeta,
    });
    await audit(req, {
      action:
        d.status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
      entity: "Document",
      entityId: doc.id,
      previousStatus: prev.status,
      newStatus: d.status,
      reason: d.rejectionReason,
    });
    res.json(apiOk(v));
  }),
);

// Applicants may delete only a document nobody has reviewed yet.
documentsRouter.delete(
  "/documents/:id",
  wrap(async (req, res) => {
    const doc = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { versions: { select: { status: true } } },
    });
    if (!doc) throw new AppError(404, "Document not found.");
    await assertApplicationAccess(req.user!, doc.applicationId);
    const admin = ["ADMIN", "SUPER_ADMIN"].includes(req.user!.role);
    if (!admin && doc.versions.some((x) => x.status !== "UPLOADED"))
      throw new AppError(
        409,
        "Reviewed documents can't be deleted. Upload a new version instead.",
      );
    await prisma.document.delete({ where: { id: doc.id } });
    await audit(req, {
      action: "DOCUMENT_DELETED",
      entity: "Document",
      entityId: doc.id,
    });
    res.json(apiOk(null, "Document deleted"));
  }),
);
