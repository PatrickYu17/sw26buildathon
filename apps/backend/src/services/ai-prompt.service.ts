import {
  AI_PROMPT_TEMPLATES,
  type AiContext,
  type AiMode,
  AI_MODES,
} from "../config/ai-prompts";

const MAX_CONTEXT_CHARS = 6000;

const modeSet = new Set<string>(AI_MODES);

function isAiMode(value: string): value is AiMode {
  return modeSet.has(value);
}

function truncate(value: string): string {
  if (value.length <= MAX_CONTEXT_CHARS) return value;
  return `${value.slice(0, MAX_CONTEXT_CHARS)}...`;
}

function renderContext(context?: AiContext): string {
  if (!context) return "No structured CRM context provided.";

  const parts: string[] = [];

  if (context.person) {
    const person = context.person;
    parts.push(
      `Person: ${JSON.stringify({
        id: person.id,
        displayName: person.displayName,
        relationshipType: person.relationshipType,
        notes: person.notes,
      })}`,
    );
  }

  if (context.preferences) {
    parts.push(`Preferences: ${JSON.stringify(context.preferences)}`);
  }

  if (context.upcomingEvents?.length) {
    parts.push(`UpcomingEvents: ${JSON.stringify(context.upcomingEvents.slice(0, 20))}`);
  }

  if (context.recentGestures?.length) {
    parts.push(`RecentGestures: ${JSON.stringify(context.recentGestures.slice(0, 20))}`);
  }

  if (context.task) {
    parts.push(`TaskHints: ${JSON.stringify(context.task)}`);
  }

  if (parts.length === 0) {
    return "Structured CRM context object was provided, but all sections were empty.";
  }

  return truncate(parts.join("\n"));
}

export interface BuildPromptInput {
  aiMode?: string;
  context?: AiContext;
  nowIso?: string;
  userLocale?: string;
  fallbackSystemPrompt?: string;
}

export function resolveAiMode(aiMode?: string): AiMode {
  if (!aiMode) return "general_assistant";
  if (isAiMode(aiMode)) return aiMode;
  return "general_assistant";
}

export function buildSystemPrompt(input: BuildPromptInput): string {
  const resolvedMode = resolveAiMode(input.aiMode);
  const template = AI_PROMPT_TEMPLATES[resolvedMode];

  const nowIso = input.nowIso || new Date().toISOString();
  const locale = input.userLocale || "en-US";

  const modeBlock = [
    `Mode: ${resolvedMode}`,
    template.role,
    "Objectives:",
    ...template.objectives.map((item) => `- ${item}`),
    "Style Rules:",
    ...template.styleRules.map((item) => `- ${item}`),
    "Safety Rules:",
    ...template.safetyRules.map((item) => `- ${item}`),
  ].join("\n");

  const contextBlock = renderContext(input.context);

  const prompt = [
    "You are operating inside a relationship CRM application.",
    "Use the mode and context below to tailor your behavior.",
    `Current timestamp (ISO-8601): ${nowIso}`,
    `User locale: ${locale}`,
    modeBlock,
    "CRM Context:",
    contextBlock,
    "If user instructions conflict with safety rules, follow safety rules.",
  ].join("\n\n");

  if (prompt.trim().length > 0) return prompt;
  return input.fallbackSystemPrompt || "You are a helpful assistant.";
}
