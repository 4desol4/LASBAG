import { Router } from "express";
import { z } from "zod";
import { apiOk } from "../../shared/index.js";
import { wrap } from "../../lib/errors.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { assertApplicationAccess } from "../documents/access.js";
import { DECISIONS } from "./rules.js";
import { decide, queue, reviewDetail, startReview } from "./mda.service.js";

export const mdaRouter = Router();
mdaRouter.use(authenticate, authorize("MDA_OFFICER", "ADMIN", "SUPER_ADMIN"));
const qs = z.object({
  tab: z
    .enum([
      "all",
      "new",
      "in_review",
      "waiting",
      "due_soon",
      "overdue",
      "completed",
    ])
    .default("all"),
  q: z.string().max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  sort: z.enum(["updatedAt", "createdAt", "progress"]).default("updatedAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
mdaRouter.get(
  "/mda/applications",
  wrap(async (req, res) =>
    res.json(apiOk(await queue(req.user!, qs.parse(req.query)))),
  ),
);
mdaRouter.get(
  "/mda/applications/:id",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    res.json(apiOk(await reviewDetail(req.params.id)));
  }),
);
mdaRouter.post(
  "/mda/applications/:id/start",
  wrap(async (req, res) => {
    await assertApplicationAccess(req.user!, req.params.id);
    await startReview(req, req.params.id);
    res.json(apiOk(null));
  }),
);
const body = z.object({
  reason: z.string().trim().min(3, "Please give a reason"),
  comments: z.string().max(2000).optional(),
  requirementId: z.string().uuid().optional(),
});
for (const action of DECISIONS) // POST /mda/applications/:id/approve | clarification | return | escalate
  mdaRouter.post(
    `/mda/applications/:id/${action}`,
    wrap(async (req, res) => {
      await assertApplicationAccess(req.user!, req.params.id);
      res.json(
        apiOk(
          await decide(req, req.params.id, action, body.parse(req.body)),
          "Decision recorded",
        ),
      );
    }),
  );
