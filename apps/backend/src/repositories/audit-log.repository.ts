import { AuditLogModel, type IAuditLog } from "../models/audit-log.model";
import { createId } from "../lib/id";
import { hasMongoConnection } from "../config/env";

type CreateAuditEntry = Omit<IAuditLog, "_id" | "createdAt">;

export const auditLogRepository = {
  async create(entry: CreateAuditEntry): Promise<void> {
    if (!hasMongoConnection) return;
    await AuditLogModel.create({
      _id: createId(),
      ...entry,
      createdAt: new Date().toISOString()
    });
  },

  async findRecent(limit = 200, search?: string): Promise<IAuditLog[]> {
    if (!hasMongoConnection) return [];
    const filter = search
      ? {
          $or: [
            { action: { $regex: search, $options: "i" } },
            { resourceType: { $regex: search, $options: "i" } },
            { adminId: { $regex: search, $options: "i" } },
            { resourceId: { $regex: search, $options: "i" } }
          ]
        }
      : {};
    return AuditLogModel.find(filter).sort({ createdAt: -1 }).limit(limit).lean<IAuditLog[]>();
  }
};

/** Fire-and-forget audit write — never throws, never blocks the response. */
export function logAudit(
  action: string,
  resourceType: string,
  resourceId: string | undefined,
  ip: string | undefined,
  diff?: Record<string, unknown>
): void {
  auditLogRepository.create({
    adminId: "admin",
    action,
    resourceType,
    resourceId,
    diff,
    ip
  }).catch(() => {});
}
