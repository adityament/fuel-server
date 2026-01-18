import express from "express";
import { login } from "../controllers/authController";
import { createAdmin, listAdmins } from "../controllers/superAdminController";
import { createStaff, deleteStaff, getMyStaff } from "../controllers/adminController";
import { allowRoles, auth } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/login", login);
router.post("/registeradmin", auth, allowRoles("superadmin"), createAdmin);
router.get("/listadmin", auth, allowRoles("superadmin"), listAdmins);
router.get("/staff", auth, allowRoles("admin"), getMyStaff);
router.post("/registerstaff", auth, allowRoles("admin"), createStaff);
router.delete("/staff/:id", auth, allowRoles("admin"), deleteStaff);


export default router;