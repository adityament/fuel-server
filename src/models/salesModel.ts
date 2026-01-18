import mongoose from "mongoose";

export interface ISale {
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
  date: Date;

  createdBy: mongoose.Types.ObjectId; // staff/admin
  adminId: mongoose.Types.ObjectId;   // admin owner
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
    date: Date,

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
  { timestamps: true }
);

export default mongoose.model<ISale>("Sale", saleSchema);
