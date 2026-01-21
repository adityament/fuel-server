import express from "express";
import { login } from "../controllers/authController";
import { createAdmin, listAdmins } from "../controllers/superAdminController";
import {
  createStaff,
  deleteStaff,
  getMyStaff,
  updateAdminProfile,
} from "../controllers/adminController";
import { allowRoles, auth } from "../middleware/authMiddleware";
import { getMe } from "../controllers/userController";
const router = express.Router();
router.post("/login", login);
router.put("/admin/update", auth, allowRoles("admin"), updateAdminProfile);
router.post("/registeradmin", auth, allowRoles("superadmin"), createAdmin);
router.get("/listadmin", auth, allowRoles("superadmin"), listAdmins);
router.get("/staff", auth, allowRoles("admin"), getMyStaff);
router.post("/registerstaff", auth, allowRoles("admin"), createStaff);
router.delete("/staff/:id", auth, allowRoles("admin"), deleteStaff);

router.get("/me", auth, getMe);

export default router;
