import { prisma } from "../../lib/prisma.js";
/** Delivery abstraction. In-app is the only provider today; email/SMS/push/WhatsApp providers implement the same interface later. */
export interface NotificationProvider { send(n: { userId: string; title: string; body: string; link?: string }): Promise<void> }
const inApp: NotificationProvider = { send: async (n) => { await prisma.notification.create({ data: n }); } };
const providers: NotificationProvider[] = [inApp];
export const notify = async (n: { userId: string; title: string; body: string; link?: string }) => { await Promise.allSettled(providers.map((p) => p.send(n))); };
export const notifyRole = async (role: "ADMIN" | "SUPER_ADMIN", n: { title: string; body: string; link?: string }) =>
  Promise.all((await prisma.user.findMany({ where: { role }, select: { id: true } })).map((u) => notify({ userId: u.id, ...n })));
