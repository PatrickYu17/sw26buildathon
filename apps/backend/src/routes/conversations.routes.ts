import { Router } from "express";
import { z } from "zod";
import { conversationService } from "../services/conversation.service";
import { aiService, type ChatMessage } from "../services/ai.service";
import { HttpError } from "../middleware/error-handler";

const CreateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const SendMessageSchema = z.object({
  content: z.union([
    z.string().min(1).max(100_000),
    z.array(
      z.union([
        z.object({
          type: z.literal("text"),
          text: z.string().min(1).max(100_000),
        }),
        z.object({
          type: z.literal("image"),
          source: z.object({
            type: z.literal("base64"),
            media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
            data: z.string().max(5_000_000),
          }),
        }),
      ]),
    ).max(20),
  ]),
  maxTokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors
      .map((e: any) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new HttpError(400, "validation_error", errors);
  }
  return result.data;
}

function getUserId(req: Express.Request): string {
  const userId = (req as any).auth?.user?.id;
  if (!userId) {
    throw new HttpError(401, "unauthorized", "Authentication required");
  }
  return userId;
}

export const conversationsRouter = Router();

// Create conversation
conversationsRouter.post("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { title } = validateBody(CreateConversationSchema, req.body || {});
    const conv = await conversationService.createConversation(userId, title);
    res.status(201).json(conv);
  } catch (error) {
    next(error);
  }
});

// List conversations
conversationsRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const conversations = await conversationService.listConversations(userId);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
});

// Send message (non-streaming, persisted)
conversationsRouter.post("/:id/messages", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { content, maxTokens, temperature } = validateBody(SendMessageSchema, req.body);

    const result = await conversationService.sendMessage(
      req.params.id,
      userId,
      content as ChatMessage["content"],
      { maxTokens, temperature },
    );

    res.status(200).json({
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      response: result.response,
    });
  } catch (error) {
    next(error);
  }
});

// Send message (SSE streaming, persisted)
conversationsRouter.post("/:id/messages/stream", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { content, maxTokens, temperature } = validateBody(SendMessageSchema, req.body);

    const { history, persistAssistantMessage } = await conversationService.streamMessage(
      req.params.id,
      userId,
      content as ChatMessage["content"],
      { maxTokens, temperature },
    );

    const abortController = new AbortController();
    res.on("close", () => {
      abortController.abort();
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Request-Id", (req as any).requestId);
    res.flushHeaders();

    const stream = aiService.chatStream(history, {
      maxTokens,
      temperature,
      signal: abortController.signal,
    });

    let fullText = "";

    for await (const chunk of stream) {
      if (abortController.signal.aborted) break;
      fullText += chunk;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    // Persist even partial responses so no work is lost
    if (fullText.length > 0) {
      await persistAssistantMessage(fullText);
    }

    if (!abortController.signal.aborted) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
      res.end();
    }
  }
});
