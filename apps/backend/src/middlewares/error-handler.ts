import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { isAppError } from "../lib/errors";

export function errorHandlerMiddleware(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      issues: error.flatten()
    });
  }

  if (isAppError(error)) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      // Never leak internal details (query info, stack traces) in production
      ...(env.NODE_ENV !== "production" && error.details !== undefined ? { details: error.details } : {})
    });
  }

  console.error("[backend] unhandled error", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}
