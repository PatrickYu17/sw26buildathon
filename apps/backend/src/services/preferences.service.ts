import { eq, and } from "drizzle-orm";
import { personPreferences, people } from "@hackathon/db";
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

export async function listPreferences(
  personId: string,
  userId: string,
  opts?: { kind?: string },
) {
  await verifyPersonOwnership(personId, userId);

  const conditions = [eq(personPreferences.person_id, personId)];
  if (opts?.kind) conditions.push(eq(personPreferences.kind, opts.kind));

  return db
    .select()
    .from(personPreferences)
    .where(and(...conditions))
    .orderBy(personPreferences.created_at);
}

export async function createPreference(
  personId: string,
  userId: string,
  data: { kind: string; value: string; source_note_id?: string },
) {
  await verifyPersonOwnership(personId, userId);

  const normalizedValue = data.value.toLowerCase().trim();

  // Check for duplicate
  const existing = await db
    .select()
    .from(personPreferences)
    .where(
      and(
        eq(personPreferences.person_id, personId),
        eq(personPreferences.kind, data.kind),
        eq(personPreferences.value, normalizedValue),
      ),
    );

  if (existing.length > 0) {
    throw new HttpError(409, "conflict", "This preference already exists");
  }

  const [row] = await db
    .insert(personPreferences)
    .values({
      id: generateId(),
      person_id: personId,
      kind: data.kind,
      value: normalizedValue,
      source_note_id: data.source_note_id ?? null,
    })
    .returning();
  return row;
}

export async function deletePreference(id: string, userId: string) {
  const rows = await db
    .select({ pref: personPreferences, person: people })
    .from(personPreferences)
    .innerJoin(people, eq(personPreferences.person_id, people.id))
    .where(eq(personPreferences.id, id));

  if (rows.length === 0) throw new HttpError(404, "not_found", "Preference not found");
  if (rows[0].person.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this preference");

  await db.delete(personPreferences).where(eq(personPreferences.id, id));
}

export async function getPreferenceSummary(personId: string, userId: string) {
  await verifyPersonOwnership(personId, userId);

  const all = await db
    .select()
    .from(personPreferences)
    .where(eq(personPreferences.person_id, personId));

  const likes = all.filter((p) => p.kind === "like").map((p) => p.value);
  const dislikes = all.filter((p) => p.kind === "dislike").map((p) => p.value);

  return { likes, dislikes };
}

export const preferencesService = {
  listPreferences,
  createPreference,
  deletePreference,
  getPreferenceSummary,
};
