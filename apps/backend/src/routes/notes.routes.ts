import { Router } from "express";
import { z } from "zod";
import { notesService } from "../services/notes.service";
import { HttpError } from "../middleware/error-handler";

const CreateNoteSchema = z.object({
  content: z.string().min(1).max(50000),
  source: z.string().max(100).optional(),
  occurred_at: z.string().optional(),
  meta_json: z.unknown().optional(),
});

const UpdateNoteSchema = z.object({
  content: z.string().min(1).max(50000).optional(),
  source: z.string().max(100).optional(),
  occurred_at: z.string().nullable().optional(),
  meta_json: z.unknown().optional(),
});

const QuickNoteSchema = z.object({
  person_id: z.string().min(1),
  content: z.string().min(1).max(50000),
});

function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new HttpError(400, "validation_error", errors);
  }
  return result.data;
}

function getUserId(req: Express.Request): string {
  const userId = (req as any).auth?.user?.id;
  if (!userId) throw new HttpError(401, "unauthorized", "Authentication required");
  return userId;
}

export const notesRouter = Router({ mergeParams: true });

// GET /api/v1/people/:personId/notes
notesRouter.get("/people/:personId/notes", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const result = await notesService.listNotes(req.params.personId, userId, { search, limit, offset });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/people/:personId/notes
notesRouter.post("/people/:personId/notes", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreateNoteSchema, req.body);
    const data = await notesService.createNote(req.params.personId, userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/notes/:id
notesRouter.patch("/notes/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UpdateNoteSchema, req.body);
    const data = await notesService.updateNote(req.params.id, userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/notes/:id
notesRouter.delete("/notes/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await notesService.deleteNote(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/notes/quick
notesRouter.post("/notes/quick", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(QuickNoteSchema, req.body);
    const data = await notesService.quickNote(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/notes/search
notesRouter.get("/notes/search", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    if (!q) {
      res.json({ data: [] });
      return;
    }
    const data = await notesService.searchNotes(userId, q, limit);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
