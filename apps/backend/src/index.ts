import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { env } from "./lib/env";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/error-handler";
import { requestId } from "./middleware/request-id";
import { aiRouter } from "./routes/ai.routes";
import { conversationsRouter } from "./routes/conversations.routes";
import { authRouter } from "./routes/auth.routes";
import { authDebugRouter } from "./routes/auth-debug.routes";
import { protectedRouter } from "./routes/protected.routes";
import { publicRouter } from "./routes/public.routes";
import { peopleRouter } from "./routes/people.routes";
import { notesRouter } from "./routes/notes.routes";
import { eventsRouter } from "./routes/events.routes";
import { gesturesRouter } from "./routes/gestures.routes";
import { gestureTemplatesRouter } from "./routes/gesture-templates.routes";
import { preferencesRouter } from "./routes/preferences.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { importRouter } from "./routes/import.routes";
import { settingsRouter } from "./routes/settings.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        if (env.nodeEnv === "production") {
          callback(new Error("Missing Origin header"));
          return;
        }
        callback(null, true);
        return;
      }
      if (env.webOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  }),
);

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "ai_rate_limit", message: "Too many AI requests, please try again later" },
  keyGenerator: (req) => req.auth?.user?.id || req.ip || "unknown",
});

const defaultJsonParser = express.json({ limit: "1mb" });
const aiJsonParser = express.json({ limit: "25mb" });

app.use(requestId);
app.use("/api/auth", authRateLimiter);
app.all("/api/auth", toNodeHandler(auth));
app.all("/api/auth/*", toNodeHandler(auth));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    env: env.nodeEnv,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Backend is running",
  });
});

app.use("/api/v1/public", defaultJsonParser, publicRouter);
app.use("/api/v1/auth", defaultJsonParser, authRouter);
if (env.nodeEnv !== "production") {
  app.use("/api/v1/debug/auth", defaultJsonParser, authDebugRouter);
}
app.use(
  "/api/v1/ai/conversations",
  requireAuth,
  aiRateLimiter,
  aiJsonParser,
  conversationsRouter,
);
app.use(
  "/api/v1/ai",
  requireAuth,
  aiRateLimiter,
  aiJsonParser,
  aiRouter,
);
// CRM routes (mounted before the catch-all protectedRouter)
app.use("/api/v1/people", defaultJsonParser, requireAuth, peopleRouter);
app.use("/api/v1", defaultJsonParser, requireAuth, notesRouter);
app.use("/api/v1", defaultJsonParser, requireAuth, eventsRouter);
app.use("/api/v1/gestures", defaultJsonParser, requireAuth, gesturesRouter);
app.use("/api/v1/gesture-templates", defaultJsonParser, requireAuth, gestureTemplatesRouter);
app.use("/api/v1", defaultJsonParser, requireAuth, preferencesRouter);
app.use("/api/v1/dashboard", defaultJsonParser, requireAuth, dashboardRouter);
app.use("/api/v1/imports", requireAuth, aiJsonParser, importRouter);
app.use("/api/v1/settings", defaultJsonParser, requireAuth, settingsRouter);

app.use("/api/v1", defaultJsonParser, requireAuth, protectedRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`backend listening on http://${env.host}:${env.port}`);
});
