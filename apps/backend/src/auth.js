import { betterAuth } from "better-auth";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Better Auth.");
}

const pool = new Pool({ connectionString: databaseUrl });

const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3001";
const secret =
  process.env.BETTER_AUTH_SECRET ||
  (process.env.NODE_ENV === "production" ? undefined : "dev-only-change-me");
const webOrigin = process.env.WEB_ORIGIN || "http://localhost:3000";

if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required for Better Auth.");
}

export const auth = betterAuth({
  database: pool,
  baseURL: baseUrl,
  secret,
  trustedOrigins: [webOrigin, baseUrl],
  user: {
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  session: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      userId: "user_id",
    },
  },
  account: {
    fields: {
      accountId: "account_id",
      providerId: "provider_id",
      userId: "user_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  verification: {
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});
