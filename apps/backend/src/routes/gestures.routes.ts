import { Router } from "express";
import { z } from "zod";
import { gesturesService } from "../services/gestures.service";
import { HttpError } from "../middleware/error-handler";

const CreateGestureSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  effort: z.string().min(1).max(50),
  person_id: z.string().optional(),
  template_id: z.string().optional(),
  status: z.string().optional(),
  due_at: z.string().optional(),
  repeat_mode: z.string().optional(),
  repeat_every_days: z.number().int().positive().optional(),
  notes: z.string().max(5000).optional(),
});

const UpdateGestureSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  effort: z.string().min(1).max(50).optional(),
  status: z.string().optional(),
  person_id: z.string().nullable().optional(),
  due_at: z.string().nullable().optional(),
  repeat_mode: z.string().nullable().optional(),
  repeat_every_days: z.number().int().positive().nullable().optional(),
  notes: z.string().max(5000).optional(),
});

const FromTemplateSchema = z.object({
  template_id: z.string().min(1),
  person_id: z.string().optional(),
  due_at: z.string().optional(),
  overrides: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    effort: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    throw new HttpError(400, "validation_error", errors);
  }
  return result.data;
}

function getUserId(req: Express.Request): string {
  const userId = (req as any).auth?.user?.id;
  if (!userId) throw new HttpError(401, "unauthorized", "Authentication required");
  return userId;
}

function parseLimit(input: unknown, fallback = 10) {
  if (typeof input !== "string") return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, 200));
}

export const gesturesRouter = Router();

gesturesRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const person_id = typeof req.query.person_id === "string" ? req.query.person_id : undefined;
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const effort = typeof req.query.effort === "string" ? req.query.effort : undefined;
    const data = await gesturesService.listGestures(userId, { status, person_id, category, effort });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.get("/upcoming", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const limit = parseLimit(req.query.limit, 10);
    const data = await gesturesService.getUpcomingGestures(userId, limit);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.get("/overdue", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await gesturesService.getOverdueGestures(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await gesturesService.getGestureById(req.params.id, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreateGestureSchema, req.body);
    const data = await gesturesService.createGesture(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.post("/from-template", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(FromTemplateSchema, req.body);
    const data = await gesturesService.createFromTemplate(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UpdateGestureSchema, req.body);
    const data = await gesturesService.updateGesture(req.params.id, userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.post("/:id/complete", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await gesturesService.completeGesture(req.params.id, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.post("/:id/skip", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await gesturesService.skipGesture(req.params.id, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gesturesRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await gesturesService.deleteGesture(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
