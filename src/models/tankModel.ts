import mongoose from "mongoose";

const tankSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tankName: {
      type: String,
      required: true,
      trim: true,
    },

    fuelType: {
      type: String,
      enum: ["petrol", "diesel"],
      required: true,
    },

    tankId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

/**
 * 🔒 One admin = one fuel tank
 */
tankSchema.index(
  { adminId: 1, fuelType: 1 },
  { unique: true }
);

export default mongoose.model("Tank", tankSchema);
