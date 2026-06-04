import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel";
import Sale from "../models/salesModel";
import Stock from "../models/stocksModel";

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const loggedUser = (req as any).user;

    if (loggedUser.role !== "superadmin") {
      return res.status(403).json({ message: "Only super admin allowed" });
    }

    const {
      username,
      email,
      password,
      latitude,
      phone,
      longitude,
      radius
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      phone,
      role: "admin",
      location: {
        latitude,
        longitude,
        radius: radius || 100
      }
    });

    res.status(201).json({
      message: "Admin created with location",
      admin
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin" });
  }
};
export const listAdmins = async (_req: Request, res: Response) => {
const admins = await User.find({ role: "admin" }).select("-password").lean();
res.json(admins);
};

/**
 * 📊 SUPER ADMIN STATS — aggregate KPIs across all pumps/admins.
 * Powers the super-admin dashboard (previously dummy data).
 */
export const getSuperAdminStats = async (_req: Request, res: Response) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalAdmins,
      totalStaff,
      salesAgg,
      todaysTransactions,
      stockPerTank,
      recentAdmins,
    ] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "staff" }),
      Sale.aggregate([
        { $match: { isVoid: { $ne: true } } },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            quantity: { $sum: "$quantity" },
            count: { $sum: 1 },
          },
        },
      ]),
      Sale.countDocuments({ isVoid: { $ne: true }, createdAt: { $gte: startOfDay } }),
      // latest stock row per tank (current level + capacity)
      Stock.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$tankId",
            closingStock: { $first: "$closingStock" },
            capacity: { $first: "$tankCapacity" },
          },
        },
      ]),
      User.find({ role: "admin" })
        .select("username email createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalStock = stockPerTank.reduce((s, t) => s + (t.closingStock || 0), 0);
    const lowStockAlerts = stockPerTank.filter(
      (t) => t.capacity > 0 && t.closingStock < t.capacity * 0.15
    ).length;

    res.json({
      totalAdmins,
      totalStaff,
      totalRevenue: salesAgg[0]?.revenue || 0,
      totalQuantity: salesAgg[0]?.quantity || 0,
      totalTransactions: salesAgg[0]?.count || 0,
      todaysTransactions,
      totalStock,
      activeTanks: stockPerTank.length,
      lowStockAlerts,
      recentAdmins,
    });
  } catch (error) {
    console.error("Super admin stats error:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};