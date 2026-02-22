import { eq, and, gte, lte, desc, asc, sql } from "drizzle-orm";
import { events, people } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

async function verifyPersonOwnership(personId: string, userId: string) {
  const [person] = await db.select().from(people).where(eq(people.id, personId));
  if (!person) throw new HttpError(404, "not_found", "Person not found");
  if (person.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this person record");
  return person;
}

async function verifyEventOwnership(eventId: string, userId: string) {
  const rows = await db
    .select({ event: events, person: people })
    .from(events)
    .innerJoin(people, eq(events.person_id, people.id))
    .where(eq(events.id, eventId));

  if (rows.length === 0) throw new HttpError(404, "not_found", "Event not found");
  if (rows[0].person.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this event");
  return rows[0].event;
}

export async function listEventsForPerson(
  personId: string,
  userId: string,
  opts?: { from?: string; to?: string },
) {
  await verifyPersonOwnership(personId, userId);

  const conditions = [eq(events.person_id, personId)];
  if (opts?.from) conditions.push(gte(events.start_at, new Date(opts.from)));
  if (opts?.to) conditions.push(lte(events.start_at, new Date(opts.to)));

  return db
    .select()
    .from(events)
    .where(and(...conditions))
    .orderBy(asc(events.start_at));
}

export async function createEvent(
  personId: string,
  userId: string,
  data: {
    title: string;
    event_type?: string;
    start_at: string;
    end_at?: string;
    is_all_day?: boolean;
    details?: string;
  },
) {
  await verifyPersonOwnership(personId, userId);

  const [row] = await db
    .insert(events)
    .values({
      id: generateId(),
      person_id: personId,
      title: data.title,
      event_type: data.event_type ?? null,
      start_at: new Date(data.start_at),
      end_at: data.end_at ? new Date(data.end_at) : null,
      is_all_day: data.is_all_day ?? false,
      details: data.details ?? null,
    })
    .returning();
  return row;
}

export async function updateEvent(
  eventId: string,
  userId: string,
  data: Partial<{
    title: string;
    event_type: string;
    start_at: string;
    end_at: string;
    is_all_day: boolean;
    details: string;
  }>,
) {
  await verifyEventOwnership(eventId, userId);

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.title !== undefined) updates.title = data.title;
  if (data.event_type !== undefined) updates.event_type = data.event_type;
  if (data.start_at !== undefined) updates.start_at = new Date(data.start_at);
  if (data.end_at !== undefined) updates.end_at = data.end_at ? new Date(data.end_at) : null;
  if (data.is_all_day !== undefined) updates.is_all_day = data.is_all_day;
  if (data.details !== undefined) updates.details = data.details;

  const [row] = await db
    .update(events)
    .set(updates)
    .where(eq(events.id, eventId))
    .returning();
  return row;
}

export async function deleteEvent(eventId: string, userId: string) {
  await verifyEventOwnership(eventId, userId);
  await db.delete(events).where(eq(events.id, eventId));
}

export async function getEventsForDay(userId: string, date: string) {
  const dayStart = new Date(date + "T00:00:00.000Z");
  const dayEnd = new Date(date + "T23:59:59.999Z");

  return db
    .select({ event: events, person: people })
    .from(events)
    .innerJoin(people, eq(events.person_id, people.id))
    .where(
      and(
        eq(people.user_id, userId),
        gte(events.start_at, dayStart),
        lte(events.start_at, dayEnd),
      ),
    )
    .orderBy(asc(events.start_at));
}

export async function getEventsForRange(userId: string, from: string, to: string) {
  return db
    .select({ event: events, person: people })
    .from(events)
    .innerJoin(people, eq(events.person_id, people.id))
    .where(
      and(
        eq(people.user_id, userId),
        gte(events.start_at, new Date(from)),
        lte(events.start_at, new Date(to)),
      ),
    )
    .orderBy(asc(events.start_at));
}

export async function getUpcomingEvents(userId: string, limit = 10) {
  return db
    .select({ event: events, person: people })
    .from(events)
    .innerJoin(people, eq(events.person_id, people.id))
    .where(
      and(
        eq(people.user_id, userId),
        gte(events.start_at, new Date()),
      ),
    )
    .orderBy(asc(events.start_at))
    .limit(limit);
}

export const eventsService = {
  listEventsForPerson,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsForDay,
  getEventsForRange,
  getUpcomingEvents,
};
