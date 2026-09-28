import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./lib/errors.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { documentsRouter } from "./modules/documents/documents.routes.js";
import { mdaRouter } from "./modules/mda/mda.routes.js";
import { applicationsRouter } from "./modules/applications/applications.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";
import { messagesRouter } from "./modules/messages/messages.routes.js";
import { documentLibraryRouter } from "./modules/documents/library.routes.js";
import { trackRouter } from "./modules/public/track.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";

export const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);
// Public, unauthenticated and rate limited. Must stay ABOVE the routers that call authenticate on every /api path.
app.use(
  "/api/public",
  rateLimit({ windowMs: 15 * 60e3, limit: 60, standardHeaders: true }),
  trackRouter,
);
app.use("/api", applicationsRouter);
app.use("/api", notificationsRouter);
app.use("/api", messagesRouter);
app.use("/api", documentLibraryRouter);
app.use("/api", adminRouter);
app.use("/api", documentsRouter);
app.use("/api", mdaRouter);
app.use(errorHandler);
