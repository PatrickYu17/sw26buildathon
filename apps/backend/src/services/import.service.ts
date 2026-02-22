import { eq, and, desc } from "drizzle-orm";
import { importsInstagramDm, notes } from "@hackathon/db";
import { db } from "../lib/db";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

export async function uploadImport(
  userId: string,
  data: { content: string; source?: string; filename?: string; person_id?: string },
) {
  let parsedData: unknown = null;
  try {
    parsedData = JSON.parse(data.content);
  } catch {
    // Store as raw text if not JSON
  }

  const [row] = await db
    .insert(importsInstagramDm)
    .values({
      id: generateId(),
      user_id: userId,
      person_id: data.person_id ?? null,
      filename: data.filename ?? null,
      source: data.source ?? "instagram",
      status: "uploaded",
      content: data.content,
      parsed_data: parsedData,
    })
    .returning();
  return row;
}

export async function listImports(
  userId: string,
  opts?: { status?: string; limit?: number },
) {
  const conditions = [eq(importsInstagramDm.user_id, userId)];
  if (opts?.status) conditions.push(eq(importsInstagramDm.status, opts.status));

  return db
    .select()
    .from(importsInstagramDm)
    .where(and(...conditions))
    .orderBy(desc(importsInstagramDm.created_at))
    .limit(opts?.limit ?? 20);
}

export async function getImport(id: string, userId: string) {
  const [row] = await db
    .select()
    .from(importsInstagramDm)
    .where(eq(importsInstagramDm.id, id));

  if (!row) throw new HttpError(404, "not_found", "Import not found");
  if (row.user_id !== userId) throw new HttpError(403, "forbidden", "You do not own this import");
  return row;
}

export async function createNotesFromImport(
  importId: string,
  userId: string,
  personId: string,
) {
  const importRecord = await getImport(importId, userId);

  // Try to extract messages from parsed data
  let messages: Array<{ content: string; timestamp?: string }> = [];

  if (importRecord.parsed_data && Array.isArray(importRecord.parsed_data)) {
    messages = (importRecord.parsed_data as Array<Record<string, unknown>>).map((m) => ({
      content: String(m.content || m.message || m.text || ""),
      timestamp: m.timestamp ? String(m.timestamp) : undefined,
    })).filter((m) => m.content.length > 0);
  } else if (importRecord.parsed_data && typeof importRecord.parsed_data === "object") {
    const data = importRecord.parsed_data as Record<string, unknown>;
    const msgArray = data.messages || data.conversation || data.data;
    if (Array.isArray(msgArray)) {
      messages = msgArray.map((m: Record<string, unknown>) => ({
        content: String(m.content || m.message || m.text || ""),
        timestamp: m.timestamp_ms
          ? new Date(Number(m.timestamp_ms)).toISOString()
          : m.timestamp
            ? String(m.timestamp)
            : undefined,
      })).filter((m) => m.content.length > 0);
    }
  }

  // If no structured data, create a single note with the raw content
  if (messages.length === 0) {
    messages = [{ content: importRecord.content.slice(0, 50000) }];
  }

  const noteValues = messages.map((m) => ({
    id: generateId(),
    person_id: personId,
    content: m.content,
    source: "import",
    occurred_at: m.timestamp ? new Date(m.timestamp) : null,
    meta_json: { import_id: importId },
  }));

  if (noteValues.length > 0) {
    await db.insert(notes).values(noteValues);
  }

  // Update import record
  await db
    .update(importsInstagramDm)
    .set({
      status: "processed",
      person_id: personId,
      notes_created: noteValues.length,
      updated_at: new Date(),
    })
    .where(eq(importsInstagramDm.id, importId));

  return { notes_created: noteValues.length };
}

export const importService = {
  uploadImport,
  listImports,
  getImport,
  createNotesFromImport,
};
