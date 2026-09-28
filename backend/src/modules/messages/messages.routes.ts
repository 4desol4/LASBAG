import { Router } from "express";
import { z } from "zod";
import { apiOk } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, wrap } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { authenticate } from "../../middleware/auth.js";
import { assertApplicationAccess } from "../documents/access.js";
import { notify } from "../notifications/notification.service.js";

export const messagesRouter = Router();
messagesRouter.use(authenticate);

/** Which applications' conversations this user may see. Same rules as assertApplicationAccess. */
const appScope = (u: { id: string; role: string; agencyId?: string | null }) =>
  ["ADMIN", "SUPER_ADMIN"].includes(u.role)
    ? {}
    : u.role === "MDA_OFFICER"
      ? { tasks: { some: { agencyId: u.agencyId ?? "none" } } }
      : { applicantId: u.id };

async function conversationFor(user: any, id: string) {
  const c = await prisma.conversation.findUnique({
    where: { id },
    include: {
      application: {
        select: {
          id: true,
          reference: true,
          applicantId: true,
          project: { select: { title: true } },
        },
      },
    },
  });
  if (!c) throw new AppError(404, "Conversation not found.");
  await assertApplicationAccess(user, c.applicationId);
  return c;
}

messagesRouter.get(
  "/conversations",
  wrap(async (req, res) => {
    const rows = await prisma.conversation.findMany({
      where: { application: appScope(req.user!) },
      include: {
        application: {
          select: { reference: true, project: { select: { title: true } } },
        },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const unread = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        readAt: null,
        isSystem: false,
        senderId: { not: req.user!.id },
        conversation: { application: appScope(req.user!) },
      },
      _count: { _all: true },
    });
    const u = new Map(unread.map((x) => [x.conversationId, x._count._all]));
    const items = rows
      .map((c) => ({
        id: c.id,
        subject: c.subject,
        applicationId: c.applicationId,
        reference: c.application.reference,
        projectTitle: c.application.project?.title ?? null,
        lastMessage: c.messages[0]
          ? {
              body: c.messages[0].body,
              createdAt: c.messages[0].createdAt,
              isSystem: c.messages[0].isSystem,
            }
          : null,
        unread: u.get(c.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          +new Date(b.lastMessage?.createdAt ?? 0) -
          +new Date(a.lastMessage?.createdAt ?? 0),
      );
    res.json(apiOk({ items }));
  }),
);

// Every application has one "Application updates" conversation, created on first use.
messagesRouter.post(
  "/applications/:id/conversation",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    const existing = await prisma.conversation.findFirst({
      where: { applicationId: req.params.id },
    });
    res.json(
      apiOk(
        existing ??
          (await prisma.conversation.create({
            data: {
              applicationId: req.params.id,
              subject: "Application updates",
            },
          })),
      ),
    );
  }),
);

messagesRouter.get(
  "/conversations/:id",
  wrap(async (req, res) => {
    const c = await conversationFor(req.user!, req.params.id);
    await prisma.message.updateMany({
      where: {
        conversationId: c.id,
        readAt: null,
        senderId: { not: req.user!.id },
      },
      data: { readAt: new Date() },
    });
    const messages = await prisma.message.findMany({
      where: { conversationId: c.id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    const ids = [
      ...new Set(
        messages.map((m) => m.senderId).filter((x): x is string => !!x),
      ),
    ];
    const people = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
    const by = new Map(people.map((p) => [p.id, p]));
    res.json(
      apiOk({
        id: c.id,
        subject: c.subject,
        applicationId: c.applicationId,
        reference: c.application.reference,
        projectTitle: c.application.project?.title ?? null,
        messages: messages.map((m) => {
          const p = m.senderId ? by.get(m.senderId) : undefined;
          return {
            id: m.id,
            body: m.body,
            isSystem: m.isSystem,
            createdAt: m.createdAt,
            mine: m.senderId === req.user!.id,
            sender: m.isSystem
              ? "LASBAG"
              : p
                ? `${p.firstName} ${p.lastName}`
                : "Unknown",
            senderRole: p?.role ?? null,
          };
        }),
      }),
    );
  }),
);

messagesRouter.post(
  "/conversations/:id/messages",
  wrap(async (req, res) => {
    const { body } = z
      .object({
        body: z
          .string()
          .trim()
          .min(1, "Write a message first")
          .max(2000, "Keep messages under 2,000 characters"),
      })
      .parse(req.body);
    const c = await conversationFor(req.user!, req.params.id);
    const m = await prisma.message.create({
      data: { conversationId: c.id, senderId: req.user!.id, body },
    });
    await audit(req, {
      action: "MESSAGE_SENT",
      entity: "Conversation",
      entityId: c.id,
    });
    // Tell the other side in-app. Applicant -> agency officers on the case; staff -> applicant.
    if (req.user!.id !== c.application.applicantId)
      await notify({
        userId: c.application.applicantId,
        title: "New message about your application",
        body: `${c.application.reference}: ${body.slice(0, 120)}`,
        link: "/messages",
      });
    else {
      const officers = await prisma.user.findMany({
        where: {
          role: "MDA_OFFICER",
          agency: { tasks: { some: { applicationId: c.applicationId } } },
        },
        select: { id: true },
      });
      await Promise.all(
        officers.map((o) =>
          notify({
            userId: o.id,
            title: "Applicant message",
            body: `${c.application.reference}: ${body.slice(0, 120)}`,
            link: "/messages",
          }),
        ),
      );
    }
    res.status(201).json(apiOk(m, "Message sent"));
  }),
);
