import mongoose, { Schema, Document } from "mongoose";

/**
 * 📝 Immutable audit trail for sale edits / voids.
 * One record is written every time a sale is updated or soft-deleted,
 * capturing who did it and the before/after snapshot. Critical for a
 * cash-handling business so a sale can never be silently changed/removed.
 */
export interface ISaleAudit extends Document {
  saleId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  action: "update" | "void";
  before: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  createdAt: Date;
}

const saleAuditSchema = new Schema<ISaleAudit>(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["update", "void"], required: true },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

saleAuditSchema.index({ adminId: 1, createdAt: -1 });
saleAuditSchema.index({ saleId: 1 });

export default mongoose.model<ISaleAudit>("SaleAudit", saleAuditSchema);
