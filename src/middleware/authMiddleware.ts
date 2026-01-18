import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel";

export const auth = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY!);

    // ✅ SUPER ADMIN (ENV BASED, DB ME NAHI)
    if (decoded.role === "superadmin") {
      req.user = {
        role: "superadmin",
        email: process.env.SUPER_ADMIN_EMAIL
      };
      return next();
    }

    // ✅ ADMIN / STAFF (DB BASED)
    if (!decoded.id) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // 🚫 SAFETY: superadmin DB me ho to bhi block
    if (user.role === "superadmin") {
      return res.status(403).json({ message: "Superadmin cannot access user routes" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const allowRoles =
  (...roles: ("superadmin" | "admin" | "staff")[]) =>
  (req: any, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
