import express from "express";
import {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
} from "../controllers/salesController";
import { allowRoles, auth } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/create", auth, allowRoles("admin", "staff"), createSale);
router.get("/getall", auth, allowRoles("admin", "staff"), getAllSales);
router.get("/getsale/:id", auth, allowRoles("admin", "staff"), getSaleById);
router.put("/updatesale/:id", auth, allowRoles("admin", "staff"), updateSale);
router.delete("/deletesale/:id", auth, allowRoles("admin", "staff"), deleteSale);

export default router;
