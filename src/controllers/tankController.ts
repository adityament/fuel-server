import { Request, Response } from "express";
import Tank from "../models/tankModel";
import { ObjectId } from "bson";

/**
 * Generate Mongo Style ID
 */
const generateTankId = (): string => {
  return new ObjectId().toHexString();
};

/**
 * ✅ CREATE TANK
 */
export const createTank = async (req: any, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin allowed",
      });
    }

    const { tankName, fuelType, capacity } = req.body;

    if (!tankName || !fuelType || !capacity) {
      return res.status(400).json({
        message: "tankName, fuelType, capacity required",
      });
    }

    if (capacity <= 0) {
      return res.status(400).json({
        message: "Invalid capacity",
      });
    }

    /**
     * 🔒 Check one tank per fuel
     */
    const exists = await Tank.findOne({
      adminId: req.user._id,
      fuelType,
    });

    if (exists) {
      return res.status(400).json({
        message: `Only one ${fuelType} tank allowed`,
      });
    }

    const tankId = generateTankId();

    const tank = new Tank({
      adminId: req.user._id,
      tankId,
      tankName,
      fuelType,
      capacity,
    });

    await tank.save();

    res.status(201).json({
      message: "Tank created",
      tank,
    });
  } catch (err: any) {
    console.error("Create Tank Error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        message: "Tank already exists for this fuel type",
      });
    }

    res.status(500).json({
      message: err.message || "Create tank failed",
    });
  }
};

/**
 * ✅ GET ALL TANKS
 */
export const getAllTanks = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const adminId =
      req.user.role === "admin"
        ? req.user._id
        : req.user.adminId;

    const tanks = await Tank.find({ adminId }).sort({
      createdAt: -1,
    });

    res.json(tanks);
  } catch (err) {
    console.error("Get All Tanks Error:", err);
    res.status(500).json({ message: "Fetch failed" });
  }
};

/**
 * ✅ GET SINGLE TANK (By tankId OR _id)
 */
export const getTankById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const tank = await Tank.findOne({
      $or: [{ tankId: id }, { _id: id }],
    });

    if (!tank) {
      return res.status(404).json({
        message: "Tank not found",
      });
    }

    res.json(tank);
  } catch (err) {
    console.error("Get Tank Error:", err);
    res.status(500).json({ message: "Fetch failed" });
  }
};

/**
 * ✅ UPDATE TANK
 */
export const updateTank = async (req: any, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin allowed",
      });
    }

    const tank = await Tank.findOne({
      $or: [{ tankId: req.params.id }, { _id: req.params.id }],
      adminId: req.user._id,
    });

    if (!tank) {
      return res.status(404).json({
        message: "Tank not found",
      });
    }

    const { tankName, capacity } = req.body;

    if (capacity != null && capacity <= 0) {
      return res.status(400).json({
        message: "Invalid capacity",
      });
    }

    if (tankName) tank.tankName = tankName;
    if (capacity != null) tank.capacity = capacity;

    await tank.save();

    res.json({
      message: "Tank updated",
      tank,
    });
  } catch (err) {
    console.error("Update Tank Error:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

/**
 * ✅ DELETE TANK
 */
export const deleteTank = async (req: any, res: Response) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin allowed",
      });
    }

    const tank = await Tank.findOne({
      $or: [{ tankId: req.params.id }, { _id: req.params.id }],
      adminId: req.user._id,
    });

    if (!tank) {
      return res.status(404).json({
        message: "Tank not found",
      });
    }

    await tank.deleteOne();

    res.json({
      message: "Tank deleted",
    });
  } catch (err) {
    console.error("Delete Tank Error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};
