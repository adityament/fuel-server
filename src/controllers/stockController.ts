import { Request, Response } from "express";
import Stock from "../models/stocksModel";
import User from "../models/userModel";

// ✅ CREATE STOCK (ADMIN ONLY)
export const createStock = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can create stock" });
  }

  try {
    const {
      fuelType,
      tankId,
      dipReading,
      calculatedStock,
      receivedQuantity = 0,
    } = req.body;

    const totalStock = calculatedStock + receivedQuantity;
    const closingStock = totalStock;

    const newStock = new Stock({
      fuelType,
      tankId,
      calculatedStock,
      dipReading,
      receivedQuantity,
      totalStock,
      closingStock,
      sales: 0,
      adminId: user._id // important for multi-admin
    });

    await newStock.save();
    res.status(201).json({ message: "Stock added successfully", data: newStock });
  } catch (error) {
    res.status(500).json({ message: "Error creating stock", error });
  }
};

// ✅ GET ALL STOCKS
export const getAllStocks = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    let filter: any = {};

    if (user.role === "admin") {
      filter.adminId = user._id;
    }

    if (user.role === "staff") {
      filter.adminId = user.adminId; // staff can only see their admin's stocks
    }

    const stocks = await Stock.find(filter).sort({ createdAt: -1 });
    res.status(200).json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stocks", error });
  }
};

// ✅ GET STOCK BY ID
export const getStockById = async (req: Request, res: Response) => {
  const user = (req as any).user;
  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    if (
      (user.role === "admin" && stock.adminId.toString() !== user._id) ||
      (user.role === "staff" && stock.adminId.toString() !== user.adminId)
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ message: "Error fetching stock", error });
  }
};

// ✅ UPDATE STOCK (ADMIN ONLY)
export const updateStock = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can update stock" });
  }

  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock || stock.adminId.toString() !== user._id) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const updatedStock = await Stock.findByIdAndUpdate(req.params.id, req.body, {
      new: true
    });

    res.status(200).json({ message: "Stock updated successfully", data: updatedStock });
  } catch (error) {
    res.status(500).json({ message: "Error updating stock", error });
  }
};

// ✅ DELETE STOCK (ADMIN ONLY)
export const deleteStock = async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Only admin can delete stock" });
  }

  try {
    const stock = await Stock.findById(req.params.id);

    if (!stock || stock.adminId.toString() !== user._id) {
      return res.status(404).json({ message: "Stock not found" });
    }

    await stock.deleteOne();
    res.status(200).json({ message: "Stock deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting stock", error });
  }
};
