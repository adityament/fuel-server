import { Request, Response } from "express";
import Attendance from "../models/attendanceModel";
import User from "../models/userModel";

// 🔹 Distance Calculator
const getDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 🔹 Shift
const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};

// ✅ STAFF → MARK ATTENDANCE
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { latitude, longitude, action, notes } = req.body;

    if (user.role !== "staff") {
      return res.status(403).json({ message: "Only staff can mark attendance" });
    }

    const admin = await User.findById(user.adminId);
    if (!admin || !admin.location) {
      return res.status(400).json({ message: "Admin location not configured" });
    }

    const distance = getDistanceMeters(
      latitude,
      longitude,
      admin.location.latitude,
      admin.location.longitude
    );

    if (distance > admin.location.radius) {
      return res.status(400).json({
        message: "Outside allowed location",
        distance: `${distance.toFixed(2)} meters`
      });
    }

    const now = new Date();

    const attendance = await Attendance.create({
      employeeId: user._id,
      adminId: user.adminId,
      action,
      notes,
      date: now,
      shift: getCurrentShift(),
      latitude,
      longitude,
      timeIn: action === "checkin" ? now : undefined,
      timeOut: action === "checkout" ? now : undefined
    });

    res.status(201).json({
      message: "Attendance marked",
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN + STAFF → VIEW ATTENDANCE
export const getAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;

  let filter: any = {};

  if (user.role === "admin") {
    filter.adminId = user._id;
  }

  if (user.role === "staff") {
    filter.employeeId = user._id;
  }

  const records = await Attendance.find(filter).sort({ createdAt: -1 });
  res.json(records);
};

// ✅ ADMIN → UPDATE ATTENDANCE
export const updateAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can update attendance" });
  }

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance || attendance.adminId.toString() !== user._id) {
    return res.status(404).json({ message: "Attendance not found" });
  }

  const updated = await Attendance.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({ message: "Attendance updated", updated });
};

// ✅ ADMIN → DELETE ATTENDANCE
export const deleteAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can delete attendance" });
  }

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance || attendance.adminId.toString() !== user._id) {
    return res.status(404).json({ message: "Attendance not found" });
  }

  await attendance.deleteOne();

  res.json({ message: "Attendance deleted successfully" });
};
