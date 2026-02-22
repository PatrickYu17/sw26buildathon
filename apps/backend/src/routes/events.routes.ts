import { Router } from "express";
import { z } from "zod";
import { eventsService } from "../services/events.service";
import { HttpError } from "../middleware/error-handler";

const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  event_type: z.string().max(100).optional(),
  start_at: z.string().min(1),
  end_at: z.string().optional(),
  is_all_day: z.boolean().optional(),
  details: z.string().max(5000).optional(),
});

const UpdateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  event_type: z.string().max(100).optional(),
  start_at: z.string().optional(),
  end_at: z.string().nullable().optional(),
  is_all_day: z.boolean().optional(),
  details: z.string().max(5000).optional(),
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

export const eventsRouter = Router({ mergeParams: true });

// GET /api/v1/people/:personId/events
eventsRouter.get("/people/:personId/events", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const data = await eventsService.listEventsForPerson(req.params.personId, userId, { from, to });
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/people/:personId/events
eventsRouter.post("/people/:personId/events", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(CreateEventSchema, req.body);
    const data = await eventsService.createEvent(req.params.personId, userId, body);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/events/:id
eventsRouter.patch("/events/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UpdateEventSchema, req.body);
    const data = await eventsService.updateEvent(req.params.id, userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/events/:id
eventsRouter.delete("/events/:id", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    await eventsService.deleteEvent(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/day
eventsRouter.get("/events/day", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const date = typeof req.query.date === "string" ? req.query.date : new Date().toISOString().slice(0, 10);
    const rows = await eventsService.getEventsForDay(userId, date);
    const data = rows.map((r) => ({ ...r.event, person: r.person }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/range
eventsRouter.get("/events/range", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const from = typeof req.query.from === "string" ? req.query.from : "";
    const to = typeof req.query.to === "string" ? req.query.to : "";
    if (!from || !to) {
      throw new HttpError(400, "validation_error", "from and to query params are required");
    }
    const rows = await eventsService.getEventsForRange(userId, from, to);
    const data = rows.map((r) => ({ ...r.event, person: r.person }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/events/upcoming
eventsRouter.get("/events/upcoming", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const rows = await eventsService.getUpcomingEvents(userId, limit);
    const data = rows.map((r) => ({ ...r.event, person: r.person }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
