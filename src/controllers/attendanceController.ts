import { Request, Response } from "express";
import Attendance from "../models/attendanceModel";
import User from "../models/userModel";

// 🔹 Distance Calculator
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
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
    const { latitude, longitude, action, notes, message } = req.body;

    if (user.role !== "staff") return res.status(403).json({ message: "Only staff can mark attendance" });
    if (!latitude || !longitude || !action) return res.status(400).json({ message: "Latitude, longitude and action required" });

    const admin = await User.findById(user.adminId);
    if (!admin || !admin.location) return res.status(400).json({ message: "Admin location not configured" });

    const distance = getDistanceMeters(latitude, longitude, admin.location.latitude, admin.location.longitude);
    if (distance > admin.location.radius) return res.status(400).json({ message: "Outside allowed location", distance: `${distance.toFixed(2)} meters` });

    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(now); endOfDay.setHours(23,59,59,999);

    const todayRecords = await Attendance.find({ employeeId: user._id, createdAt: { $gte: startOfDay, $lte: endOfDay } });
    const checkinCount = todayRecords.filter(r => r.action === "checkin").length;
    const checkoutCount = todayRecords.filter(r => r.action === "checkout").length;

    if (action === "checkin" && checkinCount >= 3) return res.status(400).json({ message: "Maximum 3 check-ins allowed per day" });
    if (action === "checkout" && checkoutCount >= 3) return res.status(400).json({ message: "Maximum 3 check-outs allowed per day" });

    const lastAttendance = await Attendance.findOne({ employeeId: user._id }).sort({ createdAt: -1 });

    // Prevent invalid checkout
    if (action === "checkout" && (!lastAttendance || lastAttendance.action !== "checkin" || lastAttendance.timeOut)) {
      return res.status(400).json({ message: "No active check-in found" });
    }

    if (action === "checkin") {
      const attendance = await Attendance.create({
        employeeId: user._id,
        adminId: user.adminId,
        action: "checkin",
        notes,
        message,
        date: now,
        shift: getCurrentShift(),
        latitude,
        longitude,
        timeIn: now,
      });

      return res.status(201).json({ message: "Checked in successfully", attendance });
    }

    if (action === "checkout") {
      if (!lastAttendance || !lastAttendance.timeIn) return res.status(400).json({ message: "Invalid checkout request" });

      const timeIn = lastAttendance.timeIn;
      const timeOut = now;
      const workedMs = timeOut.getTime() - timeIn.getTime();
      const workedHours = Number((workedMs / (1000 * 60 * 60)).toFixed(2));

      lastAttendance.timeOut = timeOut;
      lastAttendance.action = "checkout";
      lastAttendance.notes = message || notes;
      lastAttendance.latitude = latitude;
      lastAttendance.longitude = longitude;
      lastAttendance.workedHours = workedHours;

      await lastAttendance.save();

      return res.status(200).json({ message: "Checked out successfully", workedHours, attendance: lastAttendance });
    }
  } catch (error) {
    console.error("Attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ ADMIN + STAFF → VIEW ATTENDANCE (WITH USERNAME FOR ADMIN)
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let filter: any = {};

    if (user.role === "admin") {
      filter.adminId = user._id;
    }

    if (user.role === "staff") {
      filter.employeeId = user._id;
    }

    const records = await Attendance.find(filter)
      .populate("employeeId", "username") // ✅ ONLY USERNAME
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ ADMIN → UPDATE ATTENDANCE
export const updateAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== "admin") return res.status(403).json({ message: "Only admin can update attendance" });

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance || attendance.adminId.toString() !== user._id) return res.status(404).json({ message: "Attendance not found" });

  const { notes, message, timeIn, timeOut } = req.body;

  if (timeIn && timeOut) {
    const workedMs = new Date(timeOut).getTime() - new Date(timeIn).getTime();
    attendance.workedHours = Number((workedMs / (1000 * 60 * 60)).toFixed(2));
    attendance.timeIn = new Date(timeIn);
    attendance.timeOut = new Date(timeOut);
  }

  if (notes) attendance.notes = notes;
  if (message) attendance.message = message;

  await attendance.save();

  res.json({ message: "Attendance updated", updated: attendance });
};

// ✅ ADMIN → DELETE ATTENDANCE
export const deleteAttendance = async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (user.role !== "admin") return res.status(403).json({ message: "Only admin can delete attendance" });

  const attendance = await Attendance.findById(req.params.id);
  if (!attendance || attendance.adminId.toString() !== user._id) return res.status(404).json({ message: "Attendance not found" });

  await attendance.deleteOne();
  res.json({ message: "Attendance deleted successfully" });
};
