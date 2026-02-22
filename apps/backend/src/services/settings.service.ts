import { and, eq, isNotNull } from "drizzle-orm";
import { notificationSettings, userPreferences, user, account } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

const DEFAULT_NOTIFICATION_SETTINGS = {
  event_reminders: true,
  ai_suggestions: false,
  weekly_summary: true,
  email_reminders_enabled: true,
  email_address: null as string | null,
  lead_time: "1-day",
  email_scope: "all",
  include_event_details: true,
};

const DEFAULT_USER_PREFERENCES = {
  theme: "system",
  language: "en",
};

export async function getNotificationSettings(userId: string) {
  const [row] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.user_id, userId));

  if (!row) {
    return { user_id: userId, ...DEFAULT_NOTIFICATION_SETTINGS };
  }
  return row;
}

export async function upsertNotificationSettings(
  userId: string,
  data: {
    event_reminders?: boolean;
    ai_suggestions?: boolean;
    weekly_summary?: boolean;
    email_reminders_enabled?: boolean;
    email_address?: string | null;
    lead_time?: string;
    email_scope?: string;
    include_event_details?: boolean;
  },
) {
  const values = {
    user_id: userId,
    event_reminders: data.event_reminders ?? DEFAULT_NOTIFICATION_SETTINGS.event_reminders,
    ai_suggestions: data.ai_suggestions ?? DEFAULT_NOTIFICATION_SETTINGS.ai_suggestions,
    weekly_summary: data.weekly_summary ?? DEFAULT_NOTIFICATION_SETTINGS.weekly_summary,
    email_reminders_enabled: data.email_reminders_enabled ?? DEFAULT_NOTIFICATION_SETTINGS.email_reminders_enabled,
    email_address: data.email_address ?? null,
    lead_time: data.lead_time ?? DEFAULT_NOTIFICATION_SETTINGS.lead_time,
    email_scope: data.email_scope ?? DEFAULT_NOTIFICATION_SETTINGS.email_scope,
    include_event_details: data.include_event_details ?? DEFAULT_NOTIFICATION_SETTINGS.include_event_details,
    updated_at: new Date(),
  };

  const [row] = await db
    .insert(notificationSettings)
    .values(values)
    .onConflictDoUpdate({
      target: notificationSettings.user_id,
      set: { ...values },
    })
    .returning();
  return row;
}

export async function getUserPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.user_id, userId));

  if (!row) {
    return { user_id: userId, ...DEFAULT_USER_PREFERENCES };
  }
  return row;
}

export async function upsertUserPreferences(
  userId: string,
  data: { theme?: string; language?: string },
) {
  const values = {
    user_id: userId,
    theme: data.theme ?? DEFAULT_USER_PREFERENCES.theme,
    language: data.language ?? DEFAULT_USER_PREFERENCES.language,
    updated_at: new Date(),
  };

  const [row] = await db
    .insert(userPreferences)
    .values(values)
    .onConflictDoUpdate({
      target: userPreferences.user_id,
      set: { ...values },
    })
    .returning();
  return row;
}

export async function updateProfile(
  userId: string,
  data: Partial<{ name: string; email: string; image: string }>,
) {
  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.image !== undefined) updates.image = data.image;

  const [row] = await db
    .update(user)
    .set(updates)
    .where(eq(user.id, userId))
    .returning();

  if (!row) throw new HttpError(404, "not_found", "User not found");
  return row;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const [acc] = await db
    .select()
    .from(account)
    .where(and(eq(account.user_id, userId), isNotNull(account.password)));

  if (!acc?.password) {
    throw new HttpError(400, "bad_request", "No password set for this account");
  }

  const valid = await Bun.password.verify(currentPassword, acc.password);
  if (!valid) {
    throw new HttpError(401, "unauthorized", "Current password is incorrect");
  }

  const hashed = await Bun.password.hash(newPassword);
  await db
    .update(account)
    .set({ password: hashed, updated_at: new Date() })
    .where(eq(account.id, acc.id));
}

export async function deleteAccount(userId: string, password: string) {
  const [acc] = await db
    .select()
    .from(account)
    .where(and(eq(account.user_id, userId), isNotNull(account.password)));

  if (!acc?.password) {
    throw new HttpError(400, "bad_request", "No password set for this account");
  }

  const valid = await Bun.password.verify(password, acc.password);
  if (!valid) {
    throw new HttpError(401, "unauthorized", "Password is incorrect");
  }

  // Cascading FKs handle cleanup
  await db.delete(user).where(eq(user.id, userId));
}

export const settingsService = {
  getNotificationSettings,
  upsertNotificationSettings,
  getUserPreferences,
  upsertUserPreferences,
  updateProfile,
  changePassword,
  deleteAccount,
};
