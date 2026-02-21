import { and, desc, eq, gt, sql } from "drizzle-orm";
import { Router } from "express";
import { account, session, user } from "@hackathon/db";
import { getAuthUserId, sanitizeSession } from "../lib/auth-user";
import { db } from "../lib/db";
import { attachSession, requireAuth } from "../middleware/auth";
import { HttpError } from "../middleware/error-handler";

type SessionDiagnostics = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
};

type AccountDiagnostics = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
};

const resolveCurrentUserId = (authUser: Record<string, unknown> | null): string => {
  const userId = getAuthUserId(authUser);
  if (!userId) {
    throw new HttpError(401, "unauthorized", "Authentication required.");
  }
  return userId;
};

const parseListLimit = (input: unknown, defaultLimit = 20) => {
  if (typeof input !== "string") return defaultLimit;

  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return defaultLimit;
  return Math.max(1, Math.min(parsed, 100));
};

export const authRouter = Router();

authRouter.get("/status", attachSession, (req, res) => {
  const userId = getAuthUserId(req.auth.user);

  res.status(200).json({
    authenticated: Boolean(req.auth.user),
    hasSession: Boolean(req.auth.session),
    userId,
    requestId: req.requestId,
  });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const userId = getAuthUserId(req.auth.user);

  res.status(200).json({
    authenticated: true,
    userId,
    user: req.auth.user,
    session: sanitizeSession(req.auth.session),
    requestId: req.requestId,
  });
});

authRouter.get("/diagnostics", requireAuth, async (req, res, next) => {
  try {
    const userId = resolveCurrentUserId(req.auth.user);
    const now = new Date();

    const [sessionCountRows, activeSessionCountRows, accountCountRows, userRows] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(session)
          .where(eq(session.user_id, userId)),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(session)
          .where(and(eq(session.user_id, userId), gt(session.expires_at, now))),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(account)
          .where(eq(account.user_id, userId)),
        db
          .select({ email: user.email, emailVerified: user.email_verified })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1),
      ]);

    const totalSessionCount = Number(sessionCountRows[0]?.count ?? 0);
    const activeSessionCount = Number(activeSessionCountRows[0]?.count ?? 0);
    const linkedAccountCount = Number(accountCountRows[0]?.count ?? 0);
    const profile = userRows[0] ?? null;

    res.status(200).json({
      userId,
      totalSessionCount,
      activeSessionCount,
      linkedAccountCount,
      email: profile?.email ?? null,
      emailVerified: profile?.emailVerified ?? null,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/diagnostics/sessions", requireAuth, async (req, res, next) => {
  try {
    const userId = resolveCurrentUserId(req.auth.user);
    const limit = parseListLimit(req.query.limit);

    const sessions = await db
      .select({
        id: session.id,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        ipAddress: session.ip_address,
        userAgent: session.user_agent,
      })
      .from(session)
      .where(eq(session.user_id, userId))
      .orderBy(desc(session.created_at))
      .limit(limit);

    const items: SessionDiagnostics[] = sessions;

    res.status(200).json({
      userId,
      items,
      limit,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/diagnostics/accounts", requireAuth, async (req, res, next) => {
  try {
    const userId = resolveCurrentUserId(req.auth.user);

    const accounts = await db
      .select({
        id: account.id,
        providerId: account.provider_id,
        accountId: account.account_id,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      })
      .from(account)
      .where(eq(account.user_id, userId))
      .orderBy(desc(account.created_at));

    const items: AccountDiagnostics[] = accounts;

    res.status(200).json({
      userId,
      items,
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
});
