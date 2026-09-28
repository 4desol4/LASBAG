import { Router } from "express";
import { apiOk, STAGES } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { wrap } from "../../lib/errors.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const adminRouter = Router();

// Aggregate counts only. No personal data leaves this endpoint.
adminRouter.get(
  "/admin/stats",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  wrap(async (_req, res) => {
    const since = new Date(Date.now() - 8 * 7 * 864e5);
    const [byStatus, byStage, agencies, taskGroups, recent, overdue, totals] =
      await Promise.all([
        prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.application.groupBy({
          by: ["currentStage"],
          where: { status: { notIn: ["DRAFT", "CANCELLED", "COMPLETED"] } },
          _count: { _all: true },
        }),
        prisma.agency.findMany({
          select: { id: true, code: true, name: true },
        }),
        prisma.agencyTask.groupBy({
          by: ["agencyId", "status"],
          _count: { _all: true },
        }),
        prisma.application.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.sLA.count({
          where: { completedTime: null, dueTime: { lt: new Date() } },
        }),
        prisma.application.aggregate({
          _count: { _all: true },
          _avg: { progress: true },
        }),
      ]);
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(Date.now() - (7 - i) * 7 * 864e5);
      return {
        label: start.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        start: +start,
        count: 0,
      };
    });
    for (const a of recent) {
      const t = +a.createdAt;
      for (let i = weeks.length - 1; i >= 0; i--)
        if (t >= weeks[i].start) {
          weeks[i].count++;
          break;
        }
    }
    const count = (s: string) =>
      byStatus.find((x) => x.status === s)?._count._all ?? 0;
    res.json(
      apiOk({
        totals: {
          applications: totals._count._all,
          averageProgress: Math.round(totals._avg.progress ?? 0),
          completed: count("COMPLETED"),
          inProgress: count("IN_REVIEW") + count("SUBMITTED"),
          needsApplicant: count("ACTION_REQUIRED") + count("RETURNED"),
          overdueSla: overdue,
        },
        byStatus: byStatus.map((x) => ({
          status: x.status,
          count: x._count._all,
        })),
        byStage: STAGES.map((s) => ({
          key: s.key,
          label: s.label,
          count:
            byStage.find((x) => x.currentStage === s.key)?._count._all ?? 0,
        })),
        weekly: weeks.map(({ label, count }) => ({ label, count })),
        agencies: agencies.map((a) => {
          const g = taskGroups.filter((t) => t.agencyId === a.id);
          const n = (s: string) =>
            g.find((t) => t.status === s)?._count._all ?? 0;
          return {
            code: a.code,
            name: a.name,
            waiting: n("WAITING") + n("IN_PROGRESS"),
            overdue: n("OVERDUE") + n("ESCALATED"),
            completed: n("COMPLETED"),
          };
        }),
      }),
    );
  }),
);
