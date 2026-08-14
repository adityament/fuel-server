import express from "express";
import { login, refreshAccessToken } from "../controllers/authController";
import { createAdmin, listAdmins, getSuperAdminStats } from "../controllers/superAdminController";
import {
  createStaff,
  deleteStaff,
  getMyStaff,
  updateStaff,
  updateAdminProfile,
} from "../controllers/adminController";
import { allowRoles, auth } from "../middleware/authMiddleware";
import { getMe } from "../controllers/userController";
const router = express.Router();
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.put("/admin/update", auth, allowRoles("admin"), updateAdminProfile);
router.post("/registeradmin", auth, allowRoles("superadmin"), createAdmin);
router.get("/listadmin", auth, allowRoles("superadmin"), listAdmins);
router.get("/superadmin/stats", auth, allowRoles("superadmin"), getSuperAdminStats);
router.get("/staff", auth, allowRoles("admin"), getMyStaff);
router.post("/registerstaff", auth, allowRoles("admin"), createStaff);
router.put("/staff/:id", auth, allowRoles("admin"), updateStaff);
router.delete("/staff/:id", auth, allowRoles("admin"), deleteStaff);

router.get("/me", auth, getMe);

export default router;
