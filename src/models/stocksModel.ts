import mongoose, { Schema, Document } from "mongoose";

export interface IStock extends Document {
  adminId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; 
  fuelType: string;
  tankId: string;
  dipReading: number;
  calculatedStock: number;
  receivedQuantity: number;
  totalStock: number;
  sales: number;
  closingStock: number;
  tankCapacity: number; // Tank ki max limit

  // 🗑️ Soft delete — deleted entries stay listed under "Deleted Stock"
  isDeleted: boolean;
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const stockSchema = new Schema<IStock>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fuelType: { type: String, required: true },
    tankId: { type: String, required: true },
    dipReading: { type: Number, required: true },
    calculatedStock: { type: Number, required: true },
    receivedQuantity: { type: Number, default: 0 },
    totalStock: { type: Number, required: true },
    sales: { type: Number, default: 0 },
    closingStock: { type: Number, required: true },
    tankCapacity: { type: Number, required: true }, // Added

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// 🚀 Indexes for the scoped/sorted lookups in the stock controller
stockSchema.index({ adminId: 1, createdAt: -1 });             // getAllStocks
stockSchema.index({ adminId: 1, fuelType: 1, createdAt: -1 }); // sale stock-deduction
stockSchema.index({ adminId: 1, tankId: 1, createdAt: -1 });   // createStock lastStock

export default mongoose.model<IStock>("Stock", stockSchema);
