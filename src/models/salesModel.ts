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

export default mongoose.model<ISale>("Sale", saleSchema);
