import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
export interface AuthUser { id: string; role: string; agencyId?: string | null }
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.lasbag_at ?? req.headers.authorization?.replace("Bearer ", "");
  if (!token) return next(new AppError(401, "Please sign in to continue."));
  try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser; next(); }
  catch { next(new AppError(401, "Your session has expired. Please sign in again.")); }
}
export const authorize = (...roles: string[]) => (req: Request, _r: Response, next: NextFunction) =>
  roles.includes(req.user!.role) ? next() : next(new AppError(403, "You don't have permission to do that."));
