import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  phone?: string;
  role: "superadmin" | "admin" | "staff";
  adminId?: mongoose.Types.ObjectId;

  // 🔥 NEW
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // meters
  };
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    role: {
      type: String,
      enum: ["superadmin", "admin", "staff"],
      default: "staff"
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    // ✅ ADMIN LOCATION
    location: {
      latitude: Number,
      longitude: Number,
      radius: {
        type: Number,
        default: 100
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
