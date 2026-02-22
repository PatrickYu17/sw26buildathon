import { Router } from "express";
import { z } from "zod";
import { importService } from "../services/import.service";
import { HttpError } from "../middleware/error-handler";

const UploadImportSchema = z.object({
  content: z.string().min(1),
  source: z.string().max(100).optional(),
  filename: z.string().max(500).optional(),
  person_id: z.string().optional(),
});

const CreateNotesSchema = z.object({
  person_id: z.string().min(1),
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

function parseLimit(input: unknown, fallback = 20) {
  if (typeof input !== "string") return fallback;
  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(parsed, 200));
}

export const importRouter = Router();

// POST /api/v1/imports/instagram
importRouter.post("/instagram", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UploadImportSchema, req.body);
    const data = await importService.uploadImport(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/imports
importRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const limit = parseLimit(req.query.limit, 20);
    const data = await importService.listImports(userId, { status, limit });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/imports/:id
importRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await importService.getImport(req.params.id, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/imports/:id/create-notes
importRouter.post("/:id/create-notes", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreateNotesSchema, req.body);
    const data = await importService.createNotesFromImport(req.params.id, userId, body.person_id);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});
