import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: "checkin" | "checkout";
  shift: string;
  date: Date;
  timeIn?: Date;
  timeOut?: Date;
  latitude: number;
  longitude: number;
  notes?: string;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["checkin", "checkout"], required: true },
    shift: { type: String, required: true },
    date: { type: Date, required: true },
    timeIn: { type: Date },
    timeOut: { type: Date },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
