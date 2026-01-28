import { Response } from "express";
import Sale from "../models/salesModel";
import Stock from "../models/stocksModel";

// 🔹 SHIFT
const getCurrentShift = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};
const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};
/**
 * ✅ CREATE SALE + STOCK DEDUCT
 */
export const createSale = async (req: any, res: Response) => {
  try {
    const {
      nozzleId,
      fuelType,
      openingReading,
      closingReading,
      rate,
      paymentMode,
      customerId,
    } = req.body;

    if (
      !nozzleId ||
      !fuelType ||
      openingReading == null ||
      closingReading == null ||
      rate == null
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const quantity = closingReading - openingReading;
    if (quantity <= 0) {
      return res.status(400).json({ message: "Invalid readings" });
    }

    const amount = quantity * rate;
    const shift = getCurrentShift();
    const adminId =
      req.user.role === "admin" ? req.user._id : req.user.adminId;

    const stock = await Stock.findOne({ adminId, fuelType }).sort({
      createdAt: -1,
    });

    if (!stock || stock.closingStock < quantity) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    stock.closingStock -= quantity;
    stock.sales += quantity;

    const sale = new Sale({
      nozzleId,
      fuelType,
      openingReading,
      closingReading,
      rate,
      quantity,
      amount,
      paymentMode,
      shift,
      customerId,
      date: new Date(),
      createdBy: req.user._id,
      adminId,
    });

    await stock.save();
    await sale.save();

    res.status(201).json({ message: "Sale created", sale });
  } catch (error) {
    res.status(500).json({ message: "Create sale error" });
  }
};

/**
 * ✅ GET ALL SALES
 */
export const getAllSales = async (req: any, res: Response) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { adminId: req.user._id }
        : { createdBy: req.user._id };

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch {
    res.status(500).json({ message: "Error fetching sales" });
  }
};

/**
 * ✅ GET SALE BY ID
 */
export const getSaleById = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    if (
      req.user.role === "staff" &&
      sale.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "admin" &&
      sale.adminId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(sale);
  } catch {
    res.status(500).json({ message: "Error fetching sale" });
  }
};

/**
 * 🔁 UPDATE SALE → ROLLBACK + NEW DEDUCT
 */
export const updateSale = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // ❌ Only same day
    if (!isSameDay(new Date(), sale.createdAt)) {
      return res.status(400).json({
        message: "Sale can only be edited on same day",
      });
    }

    const stock = await Stock.findOne({
      adminId: sale.adminId,
      fuelType: sale.fuelType,
    }).sort({ createdAt: -1 });

    if (!stock) return res.status(400).json({ message: "Stock not found" });

    // rollback
    stock.closingStock += sale.quantity;
    stock.sales -= sale.quantity;

    const opening = req.body.openingReading ?? sale.openingReading;
    const closing = req.body.closingReading ?? sale.closingReading;

    const newQty = closing - opening;

    if (newQty <= 0) {
      return res.status(400).json({ message: "Invalid reading" });
    }

    if (stock.closingStock < newQty) {
      return res.status(400).json({ message: "Insufficient stock" });
    }

    stock.closingStock -= newQty;
    stock.sales += newQty;

    sale.openingReading = opening;
    sale.closingReading = closing;
    sale.rate = req.body.rate ?? sale.rate;
    sale.quantity = newQty;
    sale.amount = newQty * sale.rate;

    await stock.save();
    await sale.save();

    res.json({ message: "Sale updated", sale });
  } catch {
    res.status(500).json({ message: "Update failed" });
  }
};


/**
 * ❌ DELETE SALE → STOCK RESTORE
 */
export const deleteSale = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // ❌ Only same day
    if (!isSameDay(new Date(), sale.createdAt)) {
      return res.status(400).json({
        message: "Old sale cannot be deleted",
      });
    }

    const stock = await Stock.findOne({
      adminId: sale.adminId,
      fuelType: sale.fuelType,
    }).sort({ createdAt: -1 });

    if (!stock) return res.status(400).json({ message: "Stock not found" });

    stock.closingStock += sale.quantity;
    stock.sales -= sale.quantity;

    await stock.save();
    await sale.deleteOne();

    res.json({
      message: "Sale deleted successfully",
    });
  } catch {
    res.status(500).json({ message: "Delete error" });
  }
};
