import { Router } from "express";
import { getAuthUserId, sanitizeSession } from "../lib/auth-user";
import { HttpError } from "../middleware/error-handler";

type PersonInput = {
  name: string;
  relationshipType?: string;
};

const validatePersonInput = (input: unknown): PersonInput => {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "validation_error", "Body must be an object.");
  }

  const { name, relationshipType } = input as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2) {
    throw new HttpError(
      400,
      "validation_error",
      "name must be a string with at least 2 characters.",
    );
  }

  if (relationshipType !== undefined && typeof relationshipType !== "string") {
    throw new HttpError(
      400,
      "validation_error",
      "relationshipType must be a string when provided.",
    );
  }

  return {
    name: name.trim(),
    relationshipType:
      typeof relationshipType === "string" ? relationshipType : undefined,
  };
};

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

protectedRouter.get("/people", (req, res) => {
  const ownerId = getAuthUserId(req.auth.user);

  res.status(200).json({
    items: [],
    ownerId,
    scaffold: true,
    requestId: req.requestId,
  });
});

protectedRouter.post("/people", (req, res, next) => {
  try {
    const payload = validatePersonInput(req.body);
    const ownerId = getAuthUserId(req.auth.user);

    res.status(201).json({
      id: `scaffold-${Date.now()}`,
      ownerId,
      ...payload,
      scaffold: true,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});
