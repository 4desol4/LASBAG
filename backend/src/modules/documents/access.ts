import type { AuthUser } from "../../middleware/auth.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/errors.js";
/** Applicant: own applications. MDA officer: applications with a task for their agency. Admin/Super Admin: all. */
export async function assertApplicationAccess(user: AuthUser, applicationId: string) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw new AppError(404, "Application not found.");
  if (["ADMIN", "SUPER_ADMIN"].includes(user.role)) return app;
  if (user.role === "MDA_OFFICER") {
    const t = user.agencyId && await prisma.agencyTask.findFirst({ where: { applicationId, agencyId: user.agencyId } });
    if (t) return app;
  } else if (app.applicantId === user.id) return app;
  throw new AppError(404, "Application not found."); // don't reveal existence
}
