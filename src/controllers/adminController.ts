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