import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/userModel";


export const createStaff = async (req: any, res: Response) => {
const { username, email, password, phone } = req.body;


const exists = await User.findOne({ email });
if (exists) return res.status(400).json({ message: "Staff exists" });


const hashedPassword = await bcrypt.hash(password, 10);


const staff = new User({
username,
email,
password: hashedPassword,
phone,
role: "staff",
adminId: req.user._id,
});


await staff.save();
res.status(201).json({ message: "Staff created" });
};


export const deleteStaff = async (req: any, res: Response) => {
const staff = await User.findOne({
_id: req.params.id,
adminId: req.user._id,
});


if (!staff) return res.status(404).json({ message: "Staff not found" });


await staff.deleteOne();
res.json({ message: "Staff deleted" });
};
export const getMyStaff = async (req: any, res: Response) => {
  try {
    const staff = await User.find({
      role: "staff",
      adminId: req.user._id,
    }).select("-password");

    res.json(staff);
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminProfile = async (req: any, res: Response) => {
  try {
    const adminId = req.user._id;

    // ❌ email intentionally excluded
    const { username, phone, password, location } = req.body;

    // 🔒 extra safety
    if ("email" in req.body) {
      return res.status(400).json({
        message: "Email cannot be updated",
      });
    }

    const updateData: any = {};

    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await User.findOneAndUpdate(
      { _id: adminId, role: "admin" },
      updateData,
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};