import type { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodError } from "zod";
import { apiFail } from "../shared/index.js";
export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch(next);
  };
export function errorHandler(
  err: unknown,
  _q: Request,
  res: Response,
  _n: NextFunction,
) {
  if (err instanceof AppError)
    return res.status(err.status).json(apiFail(err.message));
  if (err instanceof ZodError)
    return res
      .status(400)
      .json(
        apiFail(
          err.issues.map((i) => i.message).join("; "),
          "Validation failed",
        ),
      );
  console.error(err); // never leak stack traces
  res.status(500).json(apiFail("Something went wrong. Please try again."));
}
