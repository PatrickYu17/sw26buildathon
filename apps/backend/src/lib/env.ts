const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const parseOrigins = (value: string | undefined, fallback: string) => {
  const raw = value || fallback;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const databaseUrl = requireEnv("DATABASE_URL");
const anthropicApiKey = requireEnv("ANTHROPIC_API_KEY");

const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : "dev-only-change-me");

if (!betterAuthSecret) {
  throw new Error("BETTER_AUTH_SECRET is required.");
}

export const env = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl,
  betterAuthSecret,
  betterAuthUrl: process.env.BETTER_AUTH_URL || "http://localhost:3001",
  webOrigins: parseOrigins(
    process.env.WEB_ORIGINS || process.env.WEB_ORIGIN,
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002",
  ),
  anthropicApiKey,
  aiModel: process.env.AI_MODEL || "claude-sonnet-4-20250514",
  aiSystemPrompt: process.env.AI_SYSTEM_PROMPT || "You are a helpful assistant.",
} as const;
