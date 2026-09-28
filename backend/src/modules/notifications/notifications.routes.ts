import { Router } from "express";
import { z } from "zod";
import { apiOk } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, wrap } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate);

const qs = z.object({
  filter: z.enum(["all", "unread"]).default("all"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});
notificationsRouter.get(
  "/notifications",
  wrap(async (req, res) => {
    const q = qs.parse(req.query),
      userId = req.user!.id;
    const where = { userId, ...(q.filter === "unread" && { readAt: null }) };
    const [total, unread, items] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    res.json(
      apiOk({ items, total, unread, page: q.page, pageSize: q.pageSize }),
    );
  }),
);

notificationsRouter.post(
  "/notifications/read-all",
  wrap(async (req, res) => {
    const r = await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json(apiOk({ updated: r.count }, "All notifications marked as read"));
  }),
);

notificationsRouter.post(
  "/notifications/:id/read",
  wrap(async (req, res) => {
    const n = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    }); // own notifications only
    if (!n) throw new AppError(404, "Notification not found.");
    res.json(
      apiOk(
        await prisma.notification.update({
          where: { id: n.id },
          data: { readAt: n.readAt ?? new Date() },
        }),
      ),
    );
  }),
);
