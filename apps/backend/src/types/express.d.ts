import { auth } from "../lib/auth";

type AuthSession = typeof auth.$Infer.Session;

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth: {
        user: AuthSession["user"] | null;
        session: AuthSession["session"] | null;
      };
    }
  }
}

export {};
