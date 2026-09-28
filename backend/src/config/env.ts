import { z } from "zod";

const schema = z
  .object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    FRONTEND_URL: z.string().url(),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .superRefine((values, ctx) => {
    if (values.JWT_SECRET === values.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_REFRESH_SECRET"],
        message: "Must differ from JWT_SECRET.",
      });
    }
    if (
      values.NODE_ENV === "production" &&
      process.env.ALLOW_DEMO_SEED === "true"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ALLOW_DEMO_SEED"],
        message: "Demo seeding must be disabled in production.",
      });
    }
  });

export const env = schema.parse(process.env);
