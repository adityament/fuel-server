import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import routes from "./routes/userRoutes";
import connectDB from "./utils/db";
import salesRoutes from "./routes/salesRoutes";
import attendanceRoutes from "./routes/attendanceRoute";
import passwordRoutes from "./routes/passwordRoute";
import { seedSuperAdmin } from "./superAdmin.seed";
import contactRoutes from "./routes/contacrRoutes";
import stockRoutes from "./routes/stockRoute";
import tankRoutes from "./routes/tankRoutes";

const startServer = async () => {
  try {
    await connectDB();
    await seedSuperAdmin();

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use("/api", routes);
    app.use("/api/sales", salesRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/password", passwordRoutes);
    app.use("/api/contact", contactRoutes);
    app.use("/api/stocks",stockRoutes)
    app.use("/api/tanks", tankRoutes);
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start", error);
  }
};

startServer();
