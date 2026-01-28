import express from "express";
import {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
} from "../controllers/stockController";
import { allowRoles, auth } from "../middleware/authMiddleware";
const router = express.Router();
router.post("/createstock", auth, allowRoles("admin"), createStock);
router.get("/getallstocks", auth, allowRoles("admin", "staff"), getAllStocks);
router.get("/getstock/:id", auth, allowRoles("admin", "staff"), getStockById);
router.put("updatestock/:id", auth, allowRoles("admin"), updateStock);
router.delete("/deletestock/:id", auth, allowRoles("admin"), deleteStock);

export default router;
