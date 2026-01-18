import { Response } from "express";
import Sale from "../models/salesModel";

// 🔹 Helper function to detect current shift
const getCurrentShift = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 22) return "evening";
  return "night";
};

/**
 * ✅ CREATE SALE
 * Admin → create
 * Staff → create (linked to admin)
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
      return res.status(400).json({
        message: "Closing reading must be greater than opening reading",
      });
    }

    const amount = quantity * rate;
    const shift = getCurrentShift();

    const adminId =
      req.user.role === "admin" ? req.user._id : req.user.adminId;

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

    await sale.save();
    res.status(201).json({ message: "Sale created successfully", sale });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * ✅ GET ALL SALES
 * Admin → apna + staff ka
 * Staff → sirf apna
 */
export const getAllSales = async (req: any, res: Response) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { adminId: req.user._id }
        : { createdBy: req.user._id };

    const sales = await Sale.find(filter).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({ message: "Error fetching sales" });
  }
};

/**
 * ✅ GET SALE BY ID
 */
export const getSaleById = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    // Staff → sirf apna
    if (
      req.user.role === "staff" &&
      sale.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Admin → apna + staff
    if (
      req.user.role === "admin" &&
      sale.adminId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(sale);
  } catch (error) {
    console.error("Get Sale Error:", error);
    res.status(500).json({ message: "Error fetching sale" });
  }
};

/**
 * ✅ UPDATE SALE
 * Admin → allowed
 * Staff → only own
 */
export const updateSale = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

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

    Object.assign(sale, req.body);
    await sale.save();

    res.json({ message: "Sale updated successfully", sale });
  } catch (error) {
    console.error("Update Sale Error:", error);
    res.status(500).json({ message: "Error updating sale" });
  }
};

/**
 * ✅ DELETE SALE
 * Admin → allowed
 * Staff → only own
 */
export const deleteSale = async (req: any, res: Response) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

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

    await sale.deleteOne();
    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ message: "Error deleting sale" });
  }
};
