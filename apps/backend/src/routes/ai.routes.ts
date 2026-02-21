import { Router } from "express";
import { z } from "zod";
import { aiService, type ChatMessage } from "../services/ai.service";
import { HttpError } from "../middleware/error-handler";

const ImageBlockSchema = z.object({
  type: z.literal("image"),
  source: z.object({
    type: z.literal("base64"),
    media_type: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]),
    data: z.string().max(5_000_000),
  }),
});

const TextBlockSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1).max(100_000),
});

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string().min(1).max(100_000),
    z.array(z.union([TextBlockSchema, ImageBlockSchema])).max(20),
  ]),
});

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  maxTokens: z.number().int().positive().max(8192).optional(),
  temperature: z.number().min(0).max(1).optional(),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

function validateChatRequest(body: unknown): ChatRequest {
  const result = ChatRequestSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new HttpError(400, "validation_error", errors);
  }
  return result.data;
}

export const aiRouter = Router();

aiRouter.post("/chat", async (req, res, next) => {
  try {
    const { messages, maxTokens, temperature } = validateChatRequest(req.body);

    const response = await aiService.chat(messages as ChatMessage[], {
      maxTokens,
      temperature,
    });

    res.status(200).json({
      ...response,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

aiRouter.post("/chat/stream", async (req, res, next) => {
  try {
    const { messages, maxTokens, temperature } = validateChatRequest(req.body);

    const abortController = new AbortController();

    res.on("close", () => {
      abortController.abort();
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Request-Id", req.requestId);
    res.flushHeaders();

    const stream = aiService.chatStream(messages as ChatMessage[], {
      maxTokens,
      temperature,
      signal: abortController.signal,
    });

    for await (const chunk of stream) {
      if (abortController.signal.aborted) break;
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
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
