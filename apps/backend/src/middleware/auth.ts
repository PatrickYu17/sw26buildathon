import { fromNodeHeaders } from "better-auth/node";
import { NextFunction, Request, Response } from "express";
import { auth } from "../lib/auth";

const loadSession = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  req.auth = {
    user: session?.user ?? null,
    session: session?.session ?? null,
  };
};

export const attachSession = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    await loadSession(req);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await loadSession(req);

    if (!req.auth.user) {
      res.status(401).json({
        error: "unauthorized",
        message: "Authentication required.",
        requestId: req.requestId,
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
