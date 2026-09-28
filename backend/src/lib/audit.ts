import type { Request } from "express";
import { prisma } from "./prisma.js";
export const audit = (req: Request | null, a: { action: string; entity: string; entityId: string; previousStatus?: string; newStatus?: string; reason?: string; metadata?: object }) =>
  prisma.auditLog.create({ data: { ...a, userId: req?.user?.id, role: req?.user?.role as any, ip: req?.ip, metadata: a.metadata as any } });
