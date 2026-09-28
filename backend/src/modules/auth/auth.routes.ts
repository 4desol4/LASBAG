import { Router } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { apiOk } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { AppError, wrap } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const DEMO_USERNAME =
  /^(demo[1-5]|officer[1-3]|professional[1-2]|admin|superadmin)$/;
export const resolveLoginIdentifier = (identifier: string) => {
  const normalized = identifier.trim().toLowerCase();
  if (DEMO_USERNAME.test(normalized)) return `${normalized}@demo.invalid`;
  if (normalized.endsWith("@demo.invalid")) return null;
  return normalized;
};
const isCrossSiteProduction = (frontendUrl: string, nodeEnv: string) =>
  nodeEnv === "production" ||
  (frontendUrl.startsWith("https://") && !frontendUrl.includes("localhost"));

export const getSessionCookieOptions = (
  maxAge: number,
  nodeEnv: string,
  frontendUrl = env.FRONTEND_URL,
) => {
  const crossSite = isCrossSiteProduction(frontendUrl, nodeEnv);
  return {
    httpOnly: true,
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    secure: crossSite,
    path: "/",
    maxAge,
  };
};
const cookie = (maxAge: number) =>
  getSessionCookieOptions(maxAge, env.NODE_ENV, env.FRONTEND_URL);
const safe = (u: any) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  agencyId: u.agencyId,
});

async function issue(
  res: any,
  u: { id: string; role: string; agencyId: string | null },
) {
  const at = jwt.sign(
    { id: u.id, role: u.role, agencyId: u.agencyId },
    env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  const rt = crypto.randomBytes(48).toString("hex");
  await prisma.refreshToken.create({
    data: {
      userId: u.id,
      tokenHash: sha(rt),
      expiresAt: new Date(Date.now() + 7 * 864e5),
    },
  });
  res
    .cookie("lasbag_at", at, cookie(15 * 60e3))
    .cookie("lasbag_rt", rt, cookie(7 * 864e5));
}
const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(7).optional(),
  password: z.string().min(10, "Use at least 10 characters"),
  accountType: z.enum(["APPLICANT", "PROFESSIONAL"]).default("APPLICANT"),
});
export const authRouter = Router();
const authAttemptLimit = rateLimit({
  windowMs: 15 * 60e3,
  limit: 50,
  standardHeaders: true,
});

authRouter.post(
  "/register",
  authAttemptLimit,
  wrap(async (req, res) => {
    const { accountType, password, ...d } = registerSchema.parse(req.body);
    if (await prisma.user.findUnique({ where: { email: d.email } }))
      throw new AppError(409, "An account with this email already exists.");
    const user = await prisma.user.create({
      data: {
        ...d,
        role: accountType,
        passwordHash: await argon2.hash(password),
      },
    });
    await audit(null, {
      action: "USER_REGISTERED",
      entity: "User",
      entityId: user.id,
    });
    await issue(res, user);
    res.status(201).json(apiOk(safe(user), "Account created"));
  }),
);

authRouter.post(
  "/login",
  authAttemptLimit,
  wrap(async (req, res) => {
    const { email: identifier, password } = z
      .object({ email: z.string().trim().min(1), password: z.string() })
      .parse(req.body);
    const email = resolveLoginIdentifier(identifier);
    if (!email || !z.string().email().safeParse(email).success)
      throw new AppError(400, "Enter a valid email address or demo username.");
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password)))
      throw new AppError(401, "Email or password is incorrect.");
    await issue(res, user);
    res.json(apiOk(safe(user), "Signed in"));
  }),
);

// Refresh-token rotation: each token is single-use; a revoked token is rejected.
authRouter.post(
  "/refresh",
  authAttemptLimit,
  wrap(async (req, res) => {
    const rt = req.cookies?.lasbag_rt;
    if (!rt) throw new AppError(401, "Please sign in again.");
    const row = await prisma.refreshToken.findUnique({
      where: { tokenHash: sha(rt) },
      include: { user: true },
    });
    if (!row || row.revokedAt || row.expiresAt < new Date())
      throw new AppError(401, "Please sign in again.");
    await prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date() },
    });
    await issue(res, row.user);
    res.json(apiOk(safe(row.user)));
  }),
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    const rt = req.cookies?.lasbag_rt;
    if (rt)
      await prisma.refreshToken.updateMany({
        where: { tokenHash: sha(rt) },
        data: { revokedAt: new Date() },
      });
    res
      .clearCookie("lasbag_at", {
        path: "/",
        sameSite: "none",
        secure: true,
      })
      .clearCookie("lasbag_rt", {
        path: "/",
        sameSite: "none",
        secure: true,
      })
      .json(apiOk(null, "Signed out"));
  }),
);

authRouter.get(
  "/me",
  wrap(async (req, res) => {
    const token =
      req.cookies?.lasbag_at ??
      req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      res.json(apiOk(null));
      return;
    }

    let identity: { id: string };
    try {
      identity = jwt.verify(token, env.JWT_SECRET) as { id: string };
    } catch {
      res.json(apiOk(null));
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: identity.id } });
    res.json(apiOk(user ? safe(user) : null));
  }),
);
