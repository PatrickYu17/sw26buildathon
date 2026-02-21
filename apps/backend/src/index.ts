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
import { authRouter } from "./routes/auth.routes";
import { authDebugRouter } from "./routes/auth-debug.routes";
import { protectedRouter } from "./routes/protected.routes";
import { publicRouter } from "./routes/public.routes";

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

app.use(requestId);
app.use("/api/auth", authRateLimiter);
app.all("/api/auth", toNodeHandler(auth));
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json({ limit: "1mb" }));

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

app.use("/api/v1/public", publicRouter);
app.use("/api/v1/auth", authRouter);
if (env.nodeEnv !== "production") {
  app.use("/api/v1/debug/auth", authDebugRouter);
}
app.use("/api/v1", requireAuth, protectedRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, env.host, () => {
  console.log(`backend listening on http://${env.host}:${env.port}`);
});
