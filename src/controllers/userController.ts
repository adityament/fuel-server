// src/controllers/userController.ts
import { Response } from "express";

export const getMe = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
