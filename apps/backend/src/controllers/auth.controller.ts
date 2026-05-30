import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createSession, resolveUserFromIdToken } from "../services/auth.service";
import { authSessionSchema } from "../validators/auth.validators";

export const createSessionController: RequestHandler = asyncHandler(async (req, res) => {
  const { idToken } = authSessionSchema.parse(req.body);
  const session = await createSession(idToken);
  sendSuccess(res, session, "Session created");
});

export const meController: RequestHandler = asyncHandler(async (req, res) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Missing auth token"
    });
    return;
  }

  const user = await resolveUserFromIdToken(token);
  sendSuccess(res, user, "Authenticated user fetched");
});
