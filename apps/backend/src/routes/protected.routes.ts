import { Router } from "express";
import { getAuthUserId, sanitizeSession } from "../lib/auth-user";

export const protectedRouter = Router();

protectedRouter.get("/me", (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: req.auth.user,
    session: sanitizeSession(req.auth.session),
    requestId: req.requestId,
  });
});

protectedRouter.get("/auth-check", (req, res) => {
  const userId = getAuthUserId(req.auth.user);

  res.status(200).json({
    authenticated: true,
    userId,
    requestId: req.requestId,
  });
});
