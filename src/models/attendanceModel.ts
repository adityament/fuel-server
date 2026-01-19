import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: "checkin" | "checkout";
  shift: "morning" | "evening" | "night";
  date: Date;
  timeIn?: Date;
  timeOut?: Date;
  workedHours?: number;
  notes?: string;
  message?: string;
  latitude: number;
  longitude: number;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ["checkin", "checkout"], required: true },
    shift: { type: String, enum: ["morning", "evening", "night"], required: true },
    date: { type: Date, required: true },
    timeIn: Date,
    timeOut: Date,
    workedHours: Number,
    notes: String,
    message: String,
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
