import mongoose, { Schema, Document } from "mongoose";

export interface IStock extends Document {
  adminId: mongoose.Types.ObjectId;
  fuelType: string;
  tankId: string;
  dipReading: number;
  calculatedStock: number;
  receivedQuantity: number;
  totalStock: number;
  sales: number;
  closingStock: number;
  createdAt: Date;
  updatedAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fuelType: { type: String, required: true },
    tankId: { type: String, required: true },
    dipReading: { type: Number, required: true },
    calculatedStock: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 },
    totalStock: { type: Number, required: true },
    sales: { type: Number, default: 0 },
    closingStock: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStock>("Stock", stockSchema);
