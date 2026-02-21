import "dotenv/config";
import cors from "cors";
import express from "express";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: webOrigin,
    credentials: true,
  }),
);

app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());

app.get("/health", (_req, res) => {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const authConfigured = Boolean(process.env.BETTER_AUTH_SECRET);
  res.status(200).json({ status: "ok", databaseConfigured, authConfigured });
});

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  res.status(200).json({
    authenticated: Boolean(session),
    user: session?.user ?? null,
    session: session?.session ?? null,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
