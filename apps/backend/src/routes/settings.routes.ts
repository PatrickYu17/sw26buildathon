import { Router } from "express";
import { z } from "zod";
import { settingsService } from "../services/settings.service";
import { HttpError } from "../middleware/error-handler";

const NotificationSettingsSchema = z.object({
  event_reminders: z.boolean().optional(),
  ai_suggestions: z.boolean().optional(),
  weekly_summary: z.boolean().optional(),
  email_reminders_enabled: z.boolean().optional(),
  email_address: z.string().nullable().optional(),
  lead_time: z.string().optional(),
  email_scope: z.string().optional(),
  include_event_details: z.boolean().optional(),
});

const UserPreferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
});

const ProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  image: z.string().nullable().optional(),
});

const PasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

const DeleteAccountSchema = z.object({
  password: z.string().min(1),
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

export const settingsRouter = Router();

// GET /api/v1/settings/notifications
settingsRouter.get("/notifications", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await settingsService.getNotificationSettings(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/settings/notifications
settingsRouter.put("/notifications", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(NotificationSettingsSchema, req.body);
    const data = await settingsService.upsertNotificationSettings(userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/settings/preferences
settingsRouter.get("/preferences", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const data = await settingsService.getUserPreferences(userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/settings/preferences
settingsRouter.put("/preferences", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(UserPreferencesSchema, req.body);
    const data = await settingsService.upsertUserPreferences(userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/settings/profile
settingsRouter.patch("/profile", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(ProfileSchema, req.body);
    const data = await settingsService.updateProfile(userId, body);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/settings/password
settingsRouter.post("/password", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(PasswordSchema, req.body);
    await settingsService.changePassword(userId, body.current_password, body.new_password);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/settings/account
settingsRouter.delete("/account", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const body = validateBody(DeleteAccountSchema, req.body);
    await settingsService.deleteAccount(userId, body.password);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
