import { eq, and, desc, sql } from "drizzle-orm";
import { notes, people } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

async function verifyPersonOwnership(personId: string, userId: string) {
  const [person] = await db
    .select()
    .from(people)
    .where(eq(people.id, personId));

  if (!person) throw new HttpError(404, "not_found", "Person not found");
  if (person.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this person record");
  return person;
}

async function verifyNoteOwnership(noteId: string, userId: string) {
  const rows = await db
    .select({ note: notes, person: people })
    .from(notes)
    .innerJoin(people, eq(notes.person_id, people.id))
    .where(eq(notes.id, noteId));

  if (rows.length === 0) throw new HttpError(404, "not_found", "Note not found");
  if (rows[0].person.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this note");
  return rows[0].note;
}

export async function listNotes(
  personId: string,
  userId: string,
  opts?: { search?: string; limit?: number; offset?: number },
) {
  await verifyPersonOwnership(personId, userId);

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const conditions = [eq(notes.person_id, personId)];
  if (opts?.search) {
    conditions.push(
      sql`to_tsvector('english', ${notes.content}) @@ plainto_tsquery('english', ${opts.search})`,
    );
  }

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(notes)
      .where(and(...conditions))
      .orderBy(desc(notes.created_at))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notes)
      .where(and(...conditions)),
  ]);

  return { data, total: countResult[0]?.count ?? 0 };
}

export async function createNote(
  personId: string,
  userId: string,
  data: {
    content: string;
    source?: string;
    occurred_at?: string;
    meta_json?: unknown;
  },
) {
  await verifyPersonOwnership(personId, userId);

  const [row] = await db
    .insert(notes)
    .values({
      id: generateId(),
      person_id: personId,
      content: data.content,
      source: data.source ?? null,
      occurred_at: data.occurred_at ? new Date(data.occurred_at) : null,
      meta_json: data.meta_json ?? null,
    })
    .returning();
  return row;
}

export async function updateNote(
  noteId: string,
  userId: string,
  data: Partial<{ content: string; source: string; occurred_at: string; meta_json: unknown }>,
) {
  await verifyNoteOwnership(noteId, userId);

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.content !== undefined) updates.content = data.content;
  if (data.source !== undefined) updates.source = data.source;
  if (data.occurred_at !== undefined) updates.occurred_at = data.occurred_at ? new Date(data.occurred_at) : null;
  if (data.meta_json !== undefined) updates.meta_json = data.meta_json;

  const [row] = await db
    .update(notes)
    .set(updates)
    .where(eq(notes.id, noteId))
    .returning();
  return row;
}

export async function deleteNote(noteId: string, userId: string) {
  await verifyNoteOwnership(noteId, userId);
  await db.delete(notes).where(eq(notes.id, noteId));
}

export async function quickNote(
  userId: string,
  data: { person_id: string; content: string },
) {
  return createNote(data.person_id, userId, { content: data.content, source: "quick" });
}

export async function searchNotes(
  userId: string,
  query: string,
  limit = 20,
) {
  const rows = await db
    .select({ note: notes, person: people })
    .from(notes)
    .innerJoin(people, eq(notes.person_id, people.id))
    .where(
      and(
        eq(people.user_id, userId),
        sql`to_tsvector('english', ${notes.content}) @@ plainto_tsquery('english', ${query})`,
      ),
    )
    .orderBy(desc(notes.created_at))
    .limit(limit);

  return rows.map((r) => ({ ...r.note, person_display_name: r.person.display_name }));
}

export const notesService = {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  quickNote,
  searchNotes,
};
