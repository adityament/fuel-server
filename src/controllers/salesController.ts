import { Response } from "express";
import Sale from "../models/salesModel";
import Stock from "../models/stocksModel";
import SaleAudit from "../models/saleAuditModel";

// 🔹 SHIFT
const getCurrentShift = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};

// 🔹 Resolve the exact stock row a sale deducted from.
//    Prefer the stored stockId; fall back to the latest row for that
//    admin + fuel (covers sales created before stockId was tracked).
const resolveStockForSale = async (sale: any) => {
  if (sale.stockId) {
    const byId = await Stock.findById(sale.stockId);
    if (byId) return byId;
  }
  return Stock.findOne({ adminId: sale.adminId, fuelType: sale.fuelType }).sort({
    createdAt: -1,
  });
};

// 🔹 Snapshot of a sale for the audit trail
const snapshot = (s: any) => ({
  openingReading: s.openingReading,
  closingReading: s.closingReading,
  rate: s.rate,
  quantity: s.quantity,
  amount: s.amount,
  paymentMode: s.paymentMode,
  customerId: s.customerId,
});
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
      stockId: stock._id,
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
    const filter: any =
      req.user.role === "admin"
        ? { adminId: req.user._id }
        : { createdBy: req.user._id };

    // 🗑️ hide soft-deleted (voided) sales
    filter.isVoid = { $ne: true };

    const sales = await Sale.find(filter).sort({ createdAt: -1 }).lean();
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
    const sale = await Sale.findById(req.params.id).lean();
    if (!sale || sale.isVoid) return res.status(404).json({ message: "Sale not found" });

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

    if (!sale || sale.isVoid)
      return res.status(404).json({ message: "Sale not found" });

    // ❌ Only same day
    if (!isSameDay(new Date(), sale.createdAt)) {
      return res.status(400).json({
        message: "Sale can only be edited on same day",
      });
    }

    // ✅ adjust the EXACT stock row this sale deducted from
    const stock = await resolveStockForSale(sale);
    if (!stock) return res.status(400).json({ message: "Stock not found" });

    // 📝 snapshot before mutating (for audit trail)
    const before = snapshot(sale);

    // rollback the original quantity
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

    // re-deduct the new quantity
    stock.closingStock -= newQty;
    stock.sales += newQty;

    sale.openingReading = opening;
    sale.closingReading = closing;
    sale.rate = req.body.rate ?? sale.rate;
    sale.quantity = newQty;
    sale.amount = newQty * sale.rate;
    sale.paymentMode = req.body.paymentMode ?? sale.paymentMode;
    sale.customerId = req.body.customerId ?? sale.customerId;
    sale.stockId = stock._id; // keep the link consistent

    await stock.save();
    await sale.save();

    // 📝 write audit record (never blocks the response on failure)
    await SaleAudit.create({
      saleId: sale._id,
      adminId: sale.adminId,
      performedBy: req.user._id,
      action: "update",
      before,
      after: snapshot(sale),
      reason: req.body.reason,
    }).catch((e) => console.error("Sale audit (update) failed:", e));

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

    if (!sale || sale.isVoid)
      return res.status(404).json({ message: "Sale not found" });

    // ❌ Only same day
    if (!isSameDay(new Date(), sale.createdAt)) {
      return res.status(400).json({
        message: "Old sale cannot be deleted",
      });
    }

    // ✅ restore stock to the EXACT row this sale deducted from
    const stock = await resolveStockForSale(sale);
    if (!stock) return res.status(400).json({ message: "Stock not found" });

    const before = snapshot(sale);

    stock.closingStock += sale.quantity;
    stock.sales -= sale.quantity;

    // 🗑️ soft delete — keep the record, just hide it
    sale.isVoid = true;

    await stock.save();
    await sale.save();

    // 📝 audit trail
    await SaleAudit.create({
      saleId: sale._id,
      adminId: sale.adminId,
      performedBy: req.user._id,
      action: "void",
      before,
      reason: req.body?.reason,
    }).catch((e) => console.error("Sale audit (void) failed:", e));

    res.json({
      message: "Sale deleted successfully",
    });
  } catch {
    res.status(500).json({ message: "Delete error" });
  }
};
