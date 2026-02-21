import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incomingRequestId = req.headers["x-request-id"];
  const normalizedRequestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : randomUUID();

  req.requestId = normalizedRequestId;
  res.setHeader("x-request-id", normalizedRequestId);
  next();
};
