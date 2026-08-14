import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/userModel";


export const createStaff = async (req: any, res: Response) => {
const { username, email, password, phone, salary } = req.body;


const exists = await User.findOne({ email });
if (exists) return res.status(400).json({ message: "Staff exists" });


if (salary != null && (isNaN(Number(salary)) || Number(salary) < 0)) {
return res.status(400).json({ message: "Salary must be a number >= 0" });
}


const hashedPassword = await bcrypt.hash(password, 10);


const staff = new User({
username,
email,
password: hashedPassword,
phone,
salary: salary != null && salary !== "" ? Number(salary) : undefined,
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
/**
 * ✏️ UPDATE STAFF (ADMIN ONLY, OWN STAFF ONLY)
 */
export const updateStaff = async (req: any, res: Response) => {
  try {
    const { username, email, phone, salary } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      adminId: req.user._id,
      role: "staff",
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (
      salary != null &&
      salary !== "" &&
      (isNaN(Number(salary)) || Number(salary) < 0)
    ) {
      return res.status(400).json({ message: "Salary must be a number >= 0" });
    }

    // 🔒 email is the login identity — keep it unique
    if (email && email !== staff.email) {
      const taken = await User.findOne({ email });
      if (taken) {
        return res.status(400).json({ message: "Email already in use" });
      }
      staff.email = email;
    }

    if (username) staff.username = username;
    if (phone) staff.phone = phone;
    if (salary != null && salary !== "") staff.salary = Number(salary);

    await staff.save();

    const { password: _password, ...safeStaff } = staff.toObject();

    res.json({ message: "Staff updated successfully", staff: safeStaff });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyStaff = async (req: any, res: Response) => {
  try {
    const staff = await User.find({
      role: "staff",
      adminId: req.user._id,
    }).select("-password").lean();

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