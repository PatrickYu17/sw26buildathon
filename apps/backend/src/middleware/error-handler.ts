import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: "not_found",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.code,
      message: err.message,
      requestId: req.requestId,
    });
    return;
  }

  console.error("Unhandled error", { requestId: req.requestId, err });
  res.status(500).json({
    error: "internal_error",
    message: "An unexpected error occurred.",
    requestId: req.requestId,
  });
};
