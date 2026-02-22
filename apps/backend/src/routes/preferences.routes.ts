import { Router } from "express";
import { z } from "zod";
import { preferencesService } from "../services/preferences.service";
import { HttpError } from "../middleware/error-handler";

const CreatePreferenceSchema = z.object({
  kind: z.enum(["like", "dislike"]),
  value: z.string().min(1).max(500),
  source_note_id: z.string().optional(),
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

export const preferencesRouter = Router({ mergeParams: true });

// GET /api/v1/people/:personId/preferences
preferencesRouter.get("/people/:personId/preferences", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const kind = typeof req.query.kind === "string" ? req.query.kind : undefined;
    const data = await preferencesService.listPreferences(req.params.personId, userId, { kind });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/people/:personId/preferences
preferencesRouter.post("/people/:personId/preferences", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreatePreferenceSchema, req.body);
    const data = await preferencesService.createPreference(req.params.personId, userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/people/:personId/preferences/summary
preferencesRouter.get("/people/:personId/preferences/summary", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await preferencesService.getPreferenceSummary(req.params.personId, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/preferences/:id
preferencesRouter.delete("/preferences/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await preferencesService.deletePreference(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
