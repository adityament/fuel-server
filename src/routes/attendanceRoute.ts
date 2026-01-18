import express from "express";
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance
} from "../controllers/attendanceController";
import { allowRoles, auth } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/markattendance", auth, allowRoles("staff"), markAttendance);
router.get("/getattendance", auth, allowRoles("admin", "staff"), getAttendance);
router.put("update/:id", auth, allowRoles("admin"), updateAttendance);
router.delete("delete/:id", auth, allowRoles("admin"), deleteAttendance);

export default router;
