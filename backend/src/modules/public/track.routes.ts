import { Router } from "express";
import { z } from "zod";
import { apiOk, STAGES } from "../../shared/index.js";
import { prisma } from "../../lib/prisma.js";
import { AppError, wrap } from "../../lib/errors.js";
import { computeJourney } from "../workflow/stages.js";

/** Public, unauthenticated. Returns ONLY what is safe to show anyone holding a reference: no names, addresses, documents or agency internals. */
export const trackRouter = Router();
const publicStatus: Record<string, string> = {
  DRAFT: "Started, not yet submitted",
  SUBMITTED: "Submitted",
  IN_REVIEW: "In progress",
  ACTION_REQUIRED: "Waiting for the applicant",
  RETURNED: "Returned to the applicant",
  APPROVED: "Approved",
  REJECTED: "Not approved",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
trackRouter.get(
  "/track/:reference",
  wrap(async (req, res) => {
    const reference = z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z0-9-]{6,32}$/,
        "That doesn't look like an application reference.",
      )
      .parse(req.params.reference);
    const app = await prisma.application.findUnique({
      where: { reference },
      include: {
        requirements: {
          select: {
            status: true,
            definition: { select: { stage: true, mandatory: true } },
          },
        },
      },
    });
    if (!app)
      throw new AppError(
        404,
        "We couldn't find an application with that reference. Check it and try again.",
      );
    const journey = computeJourney(
      app.requirements.map(
        (r: {
          status: string;
          definition: { stage: string; mandatory: boolean };
        }) => ({
          stage: r.definition.stage as any,
          mandatory: r.definition.mandatory,
          status: r.status,
        }),
      ),
    );
    res.json(
      apiOk({
        reference: app.reference,
        status: publicStatus[app.status] ?? "In progress",
        progress: app.progress,
        currentStage:
          STAGES.find((s) => s.key === app.currentStage)?.label ?? null,
        updatedAt: app.updatedAt,
        stages: journey.stages.map((s) => ({
          key: s.key,
          label: s.label,
          state: s.state,
        })),
      }),
    );
  }),
);
