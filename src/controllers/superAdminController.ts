import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel";

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
const admins = await User.find({ role: "admin" }).select("-password");
res.json(admins);
};