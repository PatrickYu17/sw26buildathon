import { Router } from "express";
import { sanitizeSession } from "../lib/auth-user";
import { attachSession } from "../middleware/auth";

export const authDebugRouter = Router();

authDebugRouter.get("/session", attachSession, (req, res) => {
  res.status(200).json({
    authenticated: Boolean(req.auth.user),
    user: req.auth.user,
    session: sanitizeSession(req.auth.session),
    requestId: req.requestId,
  });
});
