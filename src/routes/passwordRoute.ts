import express from "express";
import {
  forgotPassword,
  resetPassword,
  updatePassword,
} from "../controllers/passwordController";
import { auth } from "../middleware/authMiddleware";


const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/update-password", auth, updatePassword);

export default router;
