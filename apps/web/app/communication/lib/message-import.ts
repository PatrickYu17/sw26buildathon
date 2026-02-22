export type ConversationSource = "instagram" | "text";

export type ParsedConversationMessage = {
  sender: string;
  text: string;
  timestamp?: number;
};

export type ConversationImportResult = {
  source: ConversationSource;
  messages: ParsedConversationMessage[];
  participants: string[];
  warnings: string[];
};

const MAX_TEXT_PREVIEW_LENGTH = 700;
const TIMESTAMP_PREFIX_PATTERN = /^\[(.+?)\]\s+([^:]+):\s*(.+)$/;
const TIMESTAMP_DASH_PATTERN = /^(.+?)\s+-\s+([^:]+):\s*(.+)$/;
const SENDER_PREFIX_PATTERN = /^([^:]{1,40}):\s*(.+)$/;

function normalizeMessageText(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function cleanSender(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Unknown";
}

function parseDateToEpoch(input?: string | number): number | undefined {
  if (typeof input === "number" && Number.isFinite(input)) {
    return input > 1e12 ? input : input * 1000;
  }

  if (typeof input === "string") {
    const parsed = Date.parse(input);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function parseLineBasedTranscript(raw: string): ParsedConversationMessage[] {
  const lines = raw.split(/\r?\n/);
  const messages: ParsedConversationMessage[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const timestampPrefixMatch = line.match(TIMESTAMP_PREFIX_PATTERN);
    if (timestampPrefixMatch) {
      const [, timestampValue, senderValue, messageText] = timestampPrefixMatch;
      messages.push({
        sender: cleanSender(senderValue),
        text: normalizeMessageText(messageText),
        timestamp: parseDateToEpoch(timestampValue),
      });
      continue;
    }

    const timestampDashMatch = line.match(TIMESTAMP_DASH_PATTERN);
    if (timestampDashMatch) {
      const [, timestampValue, senderValue, messageText] = timestampDashMatch;
      messages.push({
        sender: cleanSender(senderValue),
        text: normalizeMessageText(messageText),
        timestamp: parseDateToEpoch(timestampValue),
      });
      continue;
    }

    const senderPrefixMatch = line.match(SENDER_PREFIX_PATTERN);
    if (senderPrefixMatch) {
      const [, senderValue, messageText] = senderPrefixMatch;
      messages.push({
        sender: cleanSender(senderValue),
        text: normalizeMessageText(messageText),
      });
      continue;
    }

    if (messages.length > 0) {
      const previous = messages[messages.length - 1];
      previous.text = `${previous.text}\n${line}`;
      continue;
    }

    messages.push({
      sender: "Unknown",
      text: normalizeMessageText(line),
    });
  }

  return messages.filter((message) => message.text.length > 0);
}

function parseInstagramJsonPayload(
  payload: unknown
): {
  messages: ParsedConversationMessage[];
  participants: string[];
} {
  const participants = new Set<string>();
  const parsedMessages: ParsedConversationMessage[] = [];

  if (Array.isArray(payload)) {
    for (const rawEntry of payload) {
      if (!rawEntry || typeof rawEntry !== "object") {
        continue;
      }

      const message = rawEntry as {
        sender_name?: string;
        sender?: string;
        from?: string;
        content?: string;
        text?: string;
        message?: string;
        timestamp_ms?: number;
        timestamp?: string | number;
        created_at?: string;
      };

      const sender = cleanSender(message.sender_name ?? message.sender ?? message.from ?? "Unknown");
      const text = normalizeMessageText(message.content ?? message.text ?? message.message ?? "");

      if (!text) {
        continue;
      }

      participants.add(sender);
      parsedMessages.push({
        sender,
        text,
        timestamp: parseDateToEpoch(message.timestamp_ms ?? message.timestamp ?? message.created_at),
      });
    }

    parsedMessages.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    return {
      messages: parsedMessages,
      participants: Array.from(participants),
    };
  }

  if (!payload || typeof payload !== "object") {
    return { messages: parsedMessages, participants: [] };
  }

  const root = payload as {
    participants?: Array<{ name?: string }>;
    messages?: Array<{
      sender_name?: string;
      sender?: string;
      content?: string;
      text?: string;
      timestamp_ms?: number;
      created_at?: string;
    }>;
  };

  for (const participant of root.participants ?? []) {
    if (participant?.name) {
      participants.add(cleanSender(participant.name));
    }
  }

  for (const rawMessage of root.messages ?? []) {
    const sender = cleanSender(rawMessage.sender_name ?? rawMessage.sender ?? "Unknown");
    const text = normalizeMessageText(rawMessage.content ?? rawMessage.text ?? "");

    if (!text) {
      continue;
    }

    participants.add(sender);
    parsedMessages.push({
      sender,
      text,
      timestamp: parseDateToEpoch(rawMessage.timestamp_ms ?? rawMessage.created_at),
    });
  }

  parsedMessages.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  return {
    messages: parsedMessages,
    participants: Array.from(participants),
  };
}

function uniqueParticipants(messages: ParsedConversationMessage[]): string[] {
  const participantSet = new Set<string>();
  for (const message of messages) {
    participantSet.add(message.sender);
  }
  return Array.from(participantSet);
}

export function parseConversationContent(
  rawContent: string,
  source: ConversationSource
): ConversationImportResult {
  const warnings: string[] = [];
  const normalizedContent = rawContent.trim();

  if (!normalizedContent) {
    return {
      source,
      messages: [],
      participants: [],
      warnings: ["The file is empty."],
    };
  }

  const looksLikeJson =
    normalizedContent.startsWith("{") || normalizedContent.startsWith("[");

  if (source === "instagram" || looksLikeJson) {
    try {
      const payload = JSON.parse(normalizedContent);
      const jsonResult = parseInstagramJsonPayload(payload);

      if (jsonResult.messages.length > 0) {
        return {
          source,
          messages: jsonResult.messages,
          participants: jsonResult.participants,
          warnings,
        };
      }

      warnings.push("No text messages were found in JSON payload. Trying line-based parsing.");
    } catch {
      if (source === "instagram") {
        warnings.push("JSON parse failed. Trying line-based parsing.");
      }
    }
  }

  const parsedMessages = parseLineBasedTranscript(normalizedContent);
  const participants = uniqueParticipants(parsedMessages);

  return {
    source,
    messages: parsedMessages,
    participants,
    warnings,
  };
}

export function formatConversationForAnalyzer(
  messages: ParsedConversationMessage[],
  maxMessages = 250
): string {
  const toFormat = messages.slice(0, maxMessages);

  const lines = toFormat.map((message) => {
    const timestampPrefix = message.timestamp
      ? `[${new Date(message.timestamp).toISOString()}] `
      : "";
    const sanitizedText =
      message.text.length > MAX_TEXT_PREVIEW_LENGTH
        ? `${message.text.slice(0, MAX_TEXT_PREVIEW_LENGTH)}...`
        : message.text;

    return `${timestampPrefix}${message.sender}: ${sanitizedText}`;
  });

  if (messages.length > maxMessages) {
    lines.push(
      `\n[System]: Conversation trimmed to first ${maxMessages} messages for analysis.`
    );
  }

  return lines.join("\n");
}
