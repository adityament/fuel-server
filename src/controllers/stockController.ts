import { Response } from "express";
import Stock from "../models/stocksModel";
import Tank from "../models/tankModel";
import Sale from "../models/salesModel";
import SaleAudit from "../models/saleAuditModel";

/**
 * ✅ CREATE STOCK (Daily Opening / Tank Update)
 */
export const createStock = async (req: any, res: Response) => {
  try {
    const {
      fuelType,
      tankId,
      dipReading = 0,
      receivedQuantity = 0,
    } = req.body;

    if (!fuelType || !tankId) {
      return res.status(400).json({
        message: "fuelType and tankId are required",
      });
    }

    // ✅ Correct adminId (admin / staff)
    const adminId =
      req.user.role === "admin"
        ? req.user._id
        : req.user.adminId;

    // 🔍 Find tank
    const tank = await Tank.findOne({
      adminId,
      tankId,
    });

    if (!tank) {
      return res.status(400).json({
        message: "Tank not found",
      });
    }

    // ❌ Fuel mismatch
    if (tank.fuelType !== fuelType) {
      return res.status(400).json({
        message: "Fuel type does not match tank",
      });
    }

    // 🔍 Last stock of this tank (deleted entries must not seed the opening)
    const lastStock = await Stock.findOne({
      adminId,
      tankId,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    // Opening stock logic
    const openingStock = lastStock
      ? lastStock.closingStock
      : dipReading;

    const totalStock = openingStock + receivedQuantity;

    // ❌ Capacity check
    if (totalStock > tank.capacity) {
      return res.status(400).json({
        message: `Tank overflow! Max: ${tank.capacity}`,
      });
    }

    const stock = new Stock({
      adminId,
      fuelType,
      tankId,

      dipReading,
      calculatedStock: openingStock,
      receivedQuantity,

      totalStock,
      sales: 0,
      closingStock: totalStock,

      tankCapacity: tank.capacity,
      createdBy: req.user._id,
    });

    await stock.save();

    res.status(201).json({
      message: "Stock created successfully",
      stock,
    });
  } catch (err: any) {
    console.error("Create Stock Error:", err);

    res.status(500).json({
      message: err.message || "Create stock error",
    });
  }
};

/**
 * ✅ GET ALL STOCKS
 */
export const getAllStocks = async (req: any, res: Response) => {
  try {
    const adminId =
      req.user.role === "admin"
        ? req.user._id
        : req.user.adminId;

    const stocks = await Stock.find({
      adminId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(stocks);
  } catch (error) {
    console.error("Get Stocks Error:", error);

    res.status(500).json({
      message: "Error fetching stocks",
    });
  }
};

/**
 * ✅ GET STOCK BY ID
 */
export const getStockById = async (req: any, res: Response) => {
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    const adminId =
      req.user.role === "admin"
        ? req.user._id
        : req.user.adminId;

    if (stock.adminId.toString() !== adminId.toString()) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    res.json(stock);
  } catch (error) {
    console.error("Get Stock Error:", error);

    res.status(500).json({
      message: "Error fetching stock",
    });
  }
};

/**
 * ✅ UPDATE STOCK (ADMIN ONLY)
 */
export const updateStock = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can update stock",
      });
    }

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    if (stock.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const { dipReading, receivedQuantity } = req.body;

    if (dipReading != null) {
      stock.dipReading = dipReading;
    }

    if (receivedQuantity != null) {
      stock.receivedQuantity += receivedQuantity;
    }

    stock.totalStock =
      stock.calculatedStock + stock.receivedQuantity;

    stock.closingStock =
      stock.totalStock - stock.sales;

    // ❌ Capacity re-check
    if (stock.totalStock > stock.tankCapacity) {
      return res.status(400).json({
        message: `Tank overflow! Max: ${stock.tankCapacity}`,
      });
    }

    await stock.save();

    res.json({
      message: "Stock updated successfully",
      stock,
    });
  } catch (error) {
    console.error("Update Stock Error:", error);

    res.status(500).json({
      message: "Error updating stock",
    });
  }
};

/**
 * ⚠️ DELETE STOCK (ADMIN ONLY) — DESTRUCTIVE
 *
 * Soft-deletes the stock entry AND voids every sale recorded against it,
 * because those sales deducted from this exact tank balance. Nothing is
 * erased: both stay readable under "Deleted Stock".
 */
export const deleteStock = async (req: any, res: Response) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete stock",
      });
    }

    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    if (stock.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    if (stock.isDeleted) {
      return res.status(400).json({
        message: "Stock already deleted",
      });
    }

    // 🔗 Sales that deducted from this stock row
    const linkedSales = await Sale.find({
      stockId: stock._id,
      isVoid: { $ne: true },
    });

    if (linkedSales.length > 0) {
      await Sale.updateMany(
        { stockId: stock._id, isVoid: { $ne: true } },
        { $set: { isVoid: true } }
      );

      // 📝 keep the audit trail honest about the cascade
      await SaleAudit.insertMany(
        linkedSales.map((sale) => ({
          saleId: sale._id,
          adminId: sale.adminId,
          performedBy: req.user._id,
          action: "void",
          before: {
            openingReading: sale.openingReading,
            closingReading: sale.closingReading,
            rate: sale.rate,
            quantity: sale.quantity,
            amount: sale.amount,
            paymentMode: sale.paymentMode,
            customerId: sale.customerId,
          },
          reason: `Stock entry ${stock._id} deleted`,
        }))
      ).catch((e) => console.error("Sale audit (stock cascade) failed:", e));
    }

    stock.isDeleted = true;
    stock.deletedAt = new Date();
    await stock.save();

    res.json({
      message: "Stock deleted successfully",
      voidedSales: linkedSales.length,
    });
  } catch (error) {
    console.error("Delete Stock Error:", error);

    res.status(500).json({
      message: "Error deleting stock",
    });
  }
};

/**
 * 🗑️ GET DELETED STOCKS (ADMIN ONLY)
 */
export const getDeletedStocks = async (req: any, res: Response) => {
  try {
    const stocks = await Stock.find({
      adminId: req.user._id,
      isDeleted: true,
    })
      .sort({ deletedAt: -1 })
      .lean();

    res.json(stocks);
  } catch (error) {
    console.error("Get Deleted Stocks Error:", error);
    res.status(500).json({ message: "Error fetching deleted stocks" });
  }
};

/**
 * 🗑️ GET SALES VOIDED WITH A DELETED STOCK (ADMIN ONLY)
 */
export const getDeletedStockSales = async (req: any, res: Response) => {
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (stock.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    const sales = await Sale.find({ stockId: stock._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json(sales);
  } catch (error) {
    console.error("Get Deleted Stock Sales Error:", error);
    res.status(500).json({ message: "Error fetching deleted sales" });
  }
};
