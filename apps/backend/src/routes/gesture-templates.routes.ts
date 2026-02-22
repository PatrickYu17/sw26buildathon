import { Router } from "express";
import { z } from "zod";
import { gesturesService } from "../services/gestures.service";
import { HttpError } from "../middleware/error-handler";

const CreateTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  effort: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
});

const UpdateTemplateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  effort: z.string().min(1).max(50).optional(),
  description: z.string().max(2000).optional(),
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

export const gestureTemplatesRouter = Router();

gestureTemplatesRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await gesturesService.listTemplates(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gestureTemplatesRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreateTemplateSchema, req.body);
    const data = await gesturesService.createTemplate(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

gestureTemplatesRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UpdateTemplateSchema, req.body);
    const data = await gesturesService.updateTemplate(req.params.id, userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

gestureTemplatesRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await gesturesService.deleteTemplate(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
