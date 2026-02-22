import { eq, ilike, and } from "drizzle-orm";
import { people } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

export async function listPeople(
  userId: string,
  opts?: { search?: string; relationship_type?: string },
) {
  const conditions = [eq(people.user_id, userId)];

  if (opts?.search) {
    conditions.push(ilike(people.display_name, `%${opts.search}%`));
  }
  if (opts?.relationship_type) {
    conditions.push(eq(people.relationship_type, opts.relationship_type));
  }

  return db
    .select()
    .from(people)
    .where(and(...conditions))
    .orderBy(people.display_name);
}

export async function getPersonById(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(people)
    .where(eq(people.id, id));

  if (!row) {
    throw new HttpError(404, "not_found", "Person not found");
  }
  if (row.user_id !== userId) {
    throw new HttpError(403, "forbidden", "You do not own this person record");
  }
  return row;
}

export async function createPerson(
  userId: string,
  data: {
    display_name: string;
    relationship_type?: string;
    birthday?: string;
    anniversary?: string;
  },
) {
  const [row] = await db
    .insert(people)
    .values({
      id: generateId(),
      user_id: userId,
      display_name: data.display_name,
      relationship_type: data.relationship_type ?? null,
      birthday: data.birthday ? new Date(data.birthday) : null,
      anniversary: data.anniversary ? new Date(data.anniversary) : null,
    })
    .returning();
  return row;
}

export async function updatePerson(
  id: string,
  userId: string,
  data: Partial<{
    display_name: string;
    relationship_type: string;
    birthday: string;
    anniversary: string;
    notes: string;
    image: string;
  }>,
) {
  await getPersonById(id, userId);

  const updates: Record<string, unknown> = { updated_at: new Date() };
  if (data.display_name !== undefined) updates.display_name = data.display_name;
  if (data.relationship_type !== undefined) updates.relationship_type = data.relationship_type;
  if (data.birthday !== undefined) updates.birthday = data.birthday ? new Date(data.birthday) : null;
  if (data.anniversary !== undefined) updates.anniversary = data.anniversary ? new Date(data.anniversary) : null;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.image !== undefined) updates.image = data.image;

  const [row] = await db
    .update(people)
    .set(updates)
    .where(eq(people.id, id))
    .returning();
  return row;
}

export async function deletePerson(id: string, userId: string) {
  await getPersonById(id, userId);
  await db.delete(people).where(eq(people.id, id));
}

export const peopleService = {
  listPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
};
