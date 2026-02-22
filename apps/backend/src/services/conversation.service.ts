import { eq, desc, asc, and } from "drizzle-orm";
import { conversation, message } from "@hackathon/db";
import { db } from "../lib/db";
import { aiService, type ChatMessage, type ChatOptions } from "./ai.service";
import { HttpError } from "../middleware/error-handler";

function generateId(): string {
  return crypto.randomUUID();
}

export async function createConversation(userId: string, title?: string) {
  const id = generateId();
  const [row] = await db
    .insert(conversation)
    .values({
      id,
      user_id: userId,
      title: title || "New conversation",
    })
    .returning();
  return row;
}

export async function listConversations(userId: string) {
  return db
    .select()
    .from(conversation)
    .where(eq(conversation.user_id, userId))
    .orderBy(desc(conversation.updated_at));
}

async function getConversationForUser(conversationId: string, userId: string) {
  const [row] = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, conversationId));

  if (!row) {
    throw new HttpError(404, "not_found", "Conversation not found");
  }
  if (row.user_id !== userId) {
    throw new HttpError(403, "forbidden", "You do not own this conversation");
  }
  return row;
}

async function loadHistory(conversationId: string): Promise<ChatMessage[]> {
  const rows = await db
    .select()
    .from(message)
    .where(eq(message.conversation_id, conversationId))
    .orderBy(asc(message.sequence));

  return rows.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content as ChatMessage["content"],
  }));
}

async function getNextSequence(conversationId: string): Promise<number> {
  const rows = await db
    .select({ sequence: message.sequence })
    .from(message)
    .where(eq(message.conversation_id, conversationId))
    .orderBy(desc(message.sequence))
    .limit(1);

  return rows.length > 0 ? rows[0].sequence + 1 : 0;
}

async function persistMessage(
  conversationId: string,
  role: string,
  content: ChatMessage["content"],
  sequence: number,
) {
  const [row] = await db
    .insert(message)
    .values({
      id: generateId(),
      conversation_id: conversationId,
      role,
      content,
      sequence,
    })
    .returning();
  return row;
}

async function touchConversation(conversationId: string) {
  await db
    .update(conversation)
    .set({ updated_at: new Date() })
    .where(eq(conversation.id, conversationId));
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  content: ChatMessage["content"],
  options?: Omit<ChatOptions, "signal">,
) {
  await getConversationForUser(conversationId, userId);

  const history = await loadHistory(conversationId);
  let seq = await getNextSequence(conversationId);

  const userMsg = await persistMessage(conversationId, "user", content, seq++);
  history.push({ role: "user", content });

  const response = await aiService.chat(history, options);

  const assistantMsg = await persistMessage(conversationId, "assistant", response.content, seq);
  await touchConversation(conversationId);

  return { userMessage: userMsg, assistantMessage: assistantMsg, response };
}

export async function streamMessage(
  conversationId: string,
  userId: string,
  content: ChatMessage["content"],
  options?: ChatOptions,
) {
  await getConversationForUser(conversationId, userId);

  const history = await loadHistory(conversationId);
  let seq = await getNextSequence(conversationId);

  const userMsg = await persistMessage(conversationId, "user", content, seq++);
  history.push({ role: "user", content });

  const assistantSeq = seq;

  const persistAssistantMessage = async (fullText: string) => {
    const assistantMsg = await persistMessage(conversationId, "assistant", fullText, assistantSeq);
    await touchConversation(conversationId);
    return assistantMsg;
  };

  return {
    userMessage: userMsg,
    history,
    options,
    persistAssistantMessage,
  };
}

export const conversationService = {
  createConversation,
  listConversations,
  sendMessage,
  streamMessage,
};
