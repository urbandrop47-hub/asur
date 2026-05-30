import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createSession } from "../services/auth.service";
import { authSessionSchema } from "../validators/auth.validators";

export const createSessionController: RequestHandler = asyncHandler(async (req, res) => {
  const { idToken } = authSessionSchema.parse(req.body);
  const session = await createSession(idToken);
  sendSuccess(res, session, "Session created");
});

export const meController: RequestHandler = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    id: "me",
    role: "CUSTOMER",
    message: "Auth is configured for Firebase ID token verification."
  });
});
