import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { gestures, events, notes, people } from "@hackathon/db";
import { db } from "../lib/db";

export async function getDashboard(userId: string, personId?: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Days since last gesture
  const lastCompletedConditions = [
    eq(gestures.user_id, userId),
    eq(gestures.status, "completed"),
  ];
  if (personId) lastCompletedConditions.push(eq(gestures.person_id, personId));

  const [lastGesture] = await db
    .select({ completed_at: gestures.completed_at })
    .from(gestures)
    .where(and(...lastCompletedConditions))
    .orderBy(desc(gestures.completed_at))
    .limit(1);

  const daysSinceLastGesture = lastGesture?.completed_at
    ? Math.floor((now.getTime() - new Date(lastGesture.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  // Upcoming task count
  const upcomingConditions = [
    eq(gestures.user_id, userId),
    eq(gestures.status, "pending"),
  ];
  if (personId) upcomingConditions.push(eq(gestures.person_id, personId));

  const [upcomingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gestures)
    .where(and(...upcomingConditions));

  // This week count (completed gestures this week)
  const thisWeekConditions = [
    eq(gestures.user_id, userId),
    eq(gestures.status, "completed"),
    gte(gestures.completed_at, weekAgo),
  ];
  if (personId) thisWeekConditions.push(eq(gestures.person_id, personId));

  const [thisWeekCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gestures)
    .where(and(...thisWeekConditions));

  // Recent completed gestures
  const recentGestureConditions = [
    eq(gestures.user_id, userId),
    eq(gestures.status, "completed"),
  ];
  if (personId) recentGestureConditions.push(eq(gestures.person_id, personId));

  const recentGestures = await db
    .select()
    .from(gestures)
    .where(and(...recentGestureConditions))
    .orderBy(desc(gestures.completed_at))
    .limit(5);

  // Upcoming events
  const eventJoinConditions = [
    eq(people.user_id, userId),
    gte(events.start_at, now),
  ];
  if (personId) eventJoinConditions.push(eq(events.person_id, personId));

  const upcomingEvents = await db
    .select({ event: events, person: people })
    .from(events)
    .innerJoin(people, eq(events.person_id, people.id))
    .where(and(...eventJoinConditions))
    .orderBy(asc(events.start_at))
    .limit(5);

  // Recent notes
  const noteJoinConditions = [eq(people.user_id, userId)];
  if (personId) noteJoinConditions.push(eq(notes.person_id, personId));

  const recentNotes = await db
    .select({ note: notes, person: people })
    .from(notes)
    .innerJoin(people, eq(notes.person_id, people.id))
    .where(and(...noteJoinConditions))
    .orderBy(desc(notes.created_at))
    .limit(5);

  // Suggested gestures (overdue + upcoming pending, limit 3)
  const suggestedConditions = [
    eq(gestures.user_id, userId),
    eq(gestures.status, "pending"),
  ];
  if (personId) suggestedConditions.push(eq(gestures.person_id, personId));

  const suggestedGestures = await db
    .select()
    .from(gestures)
    .where(and(...suggestedConditions))
    .orderBy(asc(gestures.due_at))
    .limit(3);

  return {
    stats: {
      days_since_last_gesture: daysSinceLastGesture,
      upcoming_task_count: upcomingCount?.count ?? 0,
      this_week_count: thisWeekCount?.count ?? 0,
    },
    recent_gestures: recentGestures,
    upcoming_events: upcomingEvents.map((r) => ({ ...r.event, person: r.person })),
    recent_notes: recentNotes.map((r) => ({ ...r.note, person: r.person })),
    suggested_gestures: suggestedGestures,
  };
}

export const dashboardService = { getDashboard };
