import type { Request, Response } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { createSession } from "../services/auth.service";
import { authSessionSchema } from "../validators/auth.validators";

export const createSessionController = asyncHandler(async (req: Request, res: Response) => {
  const { idToken } = authSessionSchema.parse(req.body);
  const session = await createSession(idToken);
  sendSuccess(res, session, "Session created");
});

export const meController = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    id: "me",
    role: "CUSTOMER",
    message: "Auth is configured for Firebase ID token verification."
  });
});
