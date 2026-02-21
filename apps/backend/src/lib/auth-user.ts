import { auth } from "./auth";

type AuthSession = typeof auth.$Infer.Session;
type AuthUser = AuthSession["user"];

export const getAuthUserId = (authUser: AuthUser | null): string | null =>
  authUser?.id ?? null;

export const sanitizeSession = (
  session: AuthSession["session"] | null,
): Omit<AuthSession["session"], "token"> | null => {
  if (!session) return null;
  const { token, ...safeSession } = session;
  return safeSession;
};
