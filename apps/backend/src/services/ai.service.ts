import type Anthropic from "@anthropic-ai/sdk";
import { APIUserAbortError } from "@anthropic-ai/sdk";
import type { MessageParam, ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";
import { anthropic } from "../lib/clients/anthropic";
import { env } from "../lib/env";
import { HttpError } from "../middleware/error-handler";
import { buildSystemPrompt, resolveAiMode } from "./ai-prompt.service";
import type { AiContext, AiMode } from "../config/ai-prompts";

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
  aiMode?: AiMode | string;
  context?: AiContext;
  userLocale?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlockParam[];
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: string | null;
}

function normalizeMessages(messages: ChatMessage[]): MessageParam[] {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

function handleAnthropicError(error: unknown): never {
  if (error instanceof APIUserAbortError) {
    throw error;
  }

  if (error instanceof Error && "status" in error) {
    const apiError = error as Error & { status: number; error?: { type?: string; message?: string } };
    const status = apiError.status;
    const errorType = apiError.error?.type || "api_error";
    const message = apiError.error?.message || apiError.message;

    if (status === 401) {
      throw new HttpError(500, "ai_auth_error", "AI service authentication failed");
    }
    if (status === 429) {
      throw new HttpError(429, "ai_rate_limit", "AI service rate limit exceeded. Please try again later.");
    }
    if (status === 400) {
      throw new HttpError(400, "ai_invalid_request", message);
    }
    if (status === 413) {
      throw new HttpError(413, "ai_payload_too_large", "Request payload too large for AI service");
    }

    throw new HttpError(status >= 500 ? 502 : status, `ai_${errorType}`, message);
  }

  throw new HttpError(500, "ai_unknown_error", "An unexpected error occurred with the AI service");
}

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    maxTokens = 4096,
    temperature = 1,
    model = env.aiModel,
    signal,
    aiMode,
    context,
    userLocale,
  } = options;

  const systemPrompt = buildSystemPrompt({
    aiMode: resolveAiMode(aiMode),
    context,
    userLocale,
    fallbackSystemPrompt: env.aiSystemPrompt,
  });

  try {
    const response = await anthropic.messages.create(
      {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: normalizeMessages(messages),
      },
      { signal: signal as AbortSignal | undefined },
    );

    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      content: textContent,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      stopReason: response.stop_reason,
    };
  } catch (error) {
    if (error instanceof APIUserAbortError) throw error;
    handleAnthropicError(error);
  }
}

export async function* chatStream(
  messages: ChatMessage[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    maxTokens = 4096,
    temperature = 1,
    model = env.aiModel,
    signal,
    aiMode,
    context,
    userLocale,
  } = options;

  const systemPrompt = buildSystemPrompt({
    aiMode: resolveAiMode(aiMode),
    context,
    userLocale,
    fallbackSystemPrompt: env.aiSystemPrompt,
  });

  try {
    const stream = anthropic.messages.stream(
      {
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: normalizeMessages(messages),
      },
      { signal: signal as AbortSignal | undefined },
    );

    for await (const event of stream) {
      if (signal?.aborted) break;
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield event.delta.text;
      }
    }
  } catch (error) {
    if (error instanceof APIUserAbortError) return;
    handleAnthropicError(error);
  }
}

export const aiService = {
  chat,
  chatStream,
};

export type { AiContext, AiMode };
