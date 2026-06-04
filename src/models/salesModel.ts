import mongoose, { Document } from "mongoose";

export interface ISale extends Document {
  nozzleId: string;
  fuelType: string;

  openingReading: number;
  closingReading: number;

  rate: number;
  quantity: number;
  amount: number;

  paymentMode?: string;
  shift: string;

  customerId?: string;

  // 🔗 The exact stock row this sale deducted from (so edits/voids
  //    adjust the right tank balance, not just the latest one).
  stockId?: mongoose.Types.ObjectId;

  // 🗑️ Soft delete — voided sales are hidden from lists but never lost.
  isVoid: boolean;

  createdBy: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new mongoose.Schema(
  {
    nozzleId: { type: String, required: true },
    fuelType: { type: String, required: true },

    openingReading: Number,
    closingReading: Number,

    rate: Number,
    quantity: Number,
    amount: Number,

    paymentMode: String,
    shift: String,
    customerId: String,

    stockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stock",
    },

    isVoid: { type: Boolean, default: false },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// 🚀 Indexes for the scoped list queries in the sales controller
saleSchema.index({ adminId: 1, createdAt: -1 });   // getAllSales (admin)
saleSchema.index({ createdBy: 1, createdAt: -1 });  // getAllSales (staff)
saleSchema.index({ adminId: 1, fuelType: 1 });      // stock-deduction lookups

export default mongoose.model<ISale>("Sale", saleSchema);
