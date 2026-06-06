import { Schema, model, models } from "mongoose";

export type IAuditLog = {
  _id: string;
  adminId: string;       // email or uid identifying the admin
  action: string;        // e.g. "product.create", "order.bulk-status"
  resourceType: string;  // e.g. "product", "order", "coupon"
  resourceId?: string;   // affected document id
  diff?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;       // Date type required for MongoDB TTL index to fire
};

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId:      { type: String, required: true, index: true },
    action:       { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId:   { type: String },
    diff:         { type: Schema.Types.Mixed },
    ip:           { type: String },
    createdAt:    { type: Date, required: true }
  },
  { versionKey: false }
);

// TTL: keep logs for 1 year (seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export const AuditLogModel = models.AuditLog ?? model<IAuditLog>("AuditLog", auditLogSchema);
