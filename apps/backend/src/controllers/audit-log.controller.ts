import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler";
import { sendSuccess } from "../lib/response";
import { auditLogRepository } from "../repositories/audit-log.repository";

// ── GET /api/v1/admin/audit-log ───────────────────────────────────────────────
export const listAuditLogsController: RequestHandler = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
  const logs = await auditLogRepository.findRecent(limit, search || undefined);
  sendSuccess(res, { logs }, "Audit log fetched");
});
