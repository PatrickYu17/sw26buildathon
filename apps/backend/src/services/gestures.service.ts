import { eq, and, desc, asc, lte, gte, sql } from "drizzle-orm";
import { gestures, gestureTemplates, people } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

export async function listGestures(
  userId: string,
  opts?: { status?: string; person_id?: string; category?: string; effort?: string },
) {
  const conditions = [eq(gestures.user_id, userId)];
  if (opts?.status) conditions.push(eq(gestures.status, opts.status));
  if (opts?.person_id) conditions.push(eq(gestures.person_id, opts.person_id));
  if (opts?.category) conditions.push(eq(gestures.category, opts.category));
  if (opts?.effort) conditions.push(eq(gestures.effort, opts.effort));

  return db
    .select()
    .from(gestures)
    .where(and(...conditions))
    .orderBy(desc(gestures.created_at));
}

export async function getGestureById(id: string, userId: string) {
  const [row] = await db.select().from(gestures).where(eq(gestures.id, id));
  if (!row) throw new HttpError(404, "not_found", "Gesture not found");
  if (row.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this gesture");
  return row;
}

export async function createGesture(
  userId: string,
  data: {
    title: string;
    category: string;
    effort: string;
    person_id?: string;
    template_id?: string;
    status?: string;
    due_at?: string;
    repeat_mode?: string;
    repeat_every_days?: number;
    notes?: string;
  },
) {
  const [row] = await db
    .insert(gestures)
    .values({
      id: generateId(),
      user_id: userId,
      person_id: data.person_id ?? null,
      template_id: data.template_id ?? null,
      title: data.title,
      category: data.category,
      effort: data.effort,
      status: data.status ?? "pending",
      due_at: data.due_at ? new Date(data.due_at) : null,
      repeat_mode: data.repeat_mode ?? null,
      repeat_every_days: data.repeat_every_days ?? null,
      notes: data.notes ?? null,
    })
    .returning();
  return row;
}

export async function createFromTemplate(
  userId: string,
  data: {
    template_id: string;
    person_id?: string;
    due_at?: string;
    overrides?: Partial<{ title: string; category: string; effort: string; notes: string }>;
  },
) {
  const [template] = await db
    .select()
    .from(gestureTemplates)
    .where(eq(gestureTemplates.id, data.template_id));

  if (!template) throw new HttpError(404, "not_found", "Template not found");
  if (template.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this template");

  return createGesture(userId, {
    title: data.overrides?.title ?? template.title,
    category: data.overrides?.category ?? template.category,
    effort: data.overrides?.effort ?? template.effort,
    person_id: data.person_id,
    template_id: template.id,
    due_at: data.due_at,
    notes: data.overrides?.notes ?? template.description ?? undefined,
  });
}

export async function updateGesture(
  id: string,
  userId: string,
  data: Partial<{
    title: string;
    category: string;
    effort: string;
    status: string;
    person_id: string;
    due_at: string;
    repeat_mode: string;
    repeat_every_days: number;
    notes: string;
  }>,
) {
  await getGestureById(id, userId);

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.category !== undefined) updates.category = data.category;
  if (data.effort !== undefined) updates.effort = data.effort;
  if (data.status !== undefined) updates.status = data.status;
  if (data.person_id !== undefined) updates.person_id = data.person_id;
  if (data.due_at !== undefined) updates.due_at = data.due_at ? new Date(data.due_at) : null;
  if (data.repeat_mode !== undefined) updates.repeat_mode = data.repeat_mode;
  if (data.repeat_every_days !== undefined) updates.repeat_every_days = data.repeat_every_days;
  if (data.notes !== undefined) updates.notes = data.notes;

  const [row] = await db
    .update(gestures)
    .set(updates)
    .where(eq(gestures.id, id))
    .returning();
  return row;
}

export async function completeGesture(id: string, userId: string) {
  const gesture = await getGestureById(id, userId);

  const [updated] = await db
    .update(gestures)
    .set({
      status: "completed",
      completed_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(gestures.id, id))
    .returning();

  // If repeating, create a new pending gesture
  if (gesture.repeat_mode && gesture.repeat_every_days && gesture.due_at) {
    const nextDue = new Date(gesture.due_at);
    nextDue.setDate(nextDue.getDate() + gesture.repeat_every_days);

    await db.insert(gestures).values({
      id: generateId(),
      user_id: userId,
      person_id: gesture.person_id,
      template_id: gesture.template_id,
      title: gesture.title,
      category: gesture.category,
      effort: gesture.effort,
      status: "pending",
      due_at: nextDue,
      repeat_mode: gesture.repeat_mode,
      repeat_every_days: gesture.repeat_every_days,
      notes: gesture.notes,
    });
  }

  return updated;
}

export async function skipGesture(id: string, userId: string) {
  await getGestureById(id, userId);

  const [updated] = await db
    .update(gestures)
    .set({ status: "skipped", updated_at: new Date() })
    .where(eq(gestures.id, id))
    .returning();
  return updated;
}

export async function deleteGesture(id: string, userId: string) {
  await getGestureById(id, userId);
  await db.delete(gestures).where(eq(gestures.id, id));
}

export async function getUpcomingGestures(userId: string, limit = 10) {
  return db
    .select()
    .from(gestures)
    .where(
      and(
        eq(gestures.user_id, userId),
        eq(gestures.status, "pending"),
        gte(gestures.due_at, new Date()),
      ),
    )
    .orderBy(asc(gestures.due_at))
    .limit(limit);
}

export async function getOverdueGestures(userId: string) {
  return db
    .select()
    .from(gestures)
    .where(
      and(
        eq(gestures.user_id, userId),
        eq(gestures.status, "pending"),
        lte(gestures.due_at, new Date()),
      ),
    )
    .orderBy(asc(gestures.due_at));
}

// Templates
export async function listTemplates(userId: string) {
  return db
    .select()
    .from(gestureTemplates)
    .where(eq(gestureTemplates.user_id, userId))
    .orderBy(desc(gestureTemplates.created_at));
}

export async function createTemplate(
  userId: string,
  data: { title: string; category: string; effort: string; description?: string },
) {
  const [row] = await db
    .insert(gestureTemplates)
    .values({
      id: generateId(),
      user_id: userId,
      title: data.title,
      category: data.category,
      effort: data.effort,
      description: data.description ?? null,
    })
    .returning();
  return row;
}

export async function updateTemplate(
  id: string,
  userId: string,
  data: Partial<{ title: string; category: string; effort: string; description: string }>,
) {
  const [existing] = await db.select().from(gestureTemplates).where(eq(gestureTemplates.id, id));
  if (!existing) throw new HttpError(404, "not_found", "Template not found");
  if (existing.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this template");

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.category !== undefined) updates.category = data.category;
  if (data.effort !== undefined) updates.effort = data.effort;
  if (data.description !== undefined) updates.description = data.description;

  const [row] = await db
    .update(gestureTemplates)
    .set(updates)
    .where(eq(gestureTemplates.id, id))
    .returning();
  return row;
}

export async function deleteTemplate(id: string, userId: string) {
  const [existing] = await db.select().from(gestureTemplates).where(eq(gestureTemplates.id, id));
  if (!existing) throw new HttpError(404, "not_found", "Template not found");
  if (existing.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this template");

  await db.delete(gestureTemplates).where(eq(gestureTemplates.id, id));
}

export const gesturesService = {
  listGestures,
  getGestureById,
  createGesture,
  createFromTemplate,
  updateGesture,
  completeGesture,
  skipGesture,
  deleteGesture,
  getUpcomingGestures,
  getOverdueGestures,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
