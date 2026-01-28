import express from "express";
import {
  createTank,
  getAllTanks,
  getTankById,
  updateTank,
  deleteTank,
} from "../controllers/tankController";
import { allowRoles, auth } from "../middleware/authMiddleware";



const router = express.Router();

router.post("/create", auth, allowRoles("admin"), createTank);
router.get("/getall", auth, allowRoles("admin"), getAllTanks);
router.get("/tankbyid/:id", auth, allowRoles("admin"), getTankById);
router.put("/update/:id", auth, allowRoles("admin"), updateTank);
router.delete("/delete/:id", auth, allowRoles("admin"), deleteTank);

export default router;
