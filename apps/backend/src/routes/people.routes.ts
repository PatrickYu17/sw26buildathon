import { Router } from "express";
import { z } from "zod";
import { peopleService } from "../services/people.service";
import { HttpError } from "../middleware/error-handler";

const CreatePersonSchema = z.object({
  display_name: z.string().min(1).max(200),
  relationship_type: z.string().max(100).optional(),
  birthday: z.string().optional(),
  anniversary: z.string().optional(),
});

const UpdatePersonSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  relationship_type: z.string().max(100).optional(),
  birthday: z.string().nullable().optional(),
  anniversary: z.string().nullable().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
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

export const peopleRouter = Router();

peopleRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const relationship_type = typeof req.query.relationship_type === "string" ? req.query.relationship_type : undefined;
    const data = await peopleService.listPeople(userId, { search, relationship_type });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

peopleRouter.get("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await peopleService.getPersonById(req.params.id, userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

peopleRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreatePersonSchema, req.body);
    const data = await peopleService.createPerson(userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

peopleRouter.patch("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UpdatePersonSchema, req.body);
    const data = await peopleService.updatePerson(req.params.id, userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

peopleRouter.delete("/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await peopleService.deletePerson(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
