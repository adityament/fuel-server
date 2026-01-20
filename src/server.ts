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


const startServer = async () => {
  try {
    await connectDB(); // 1️⃣ DB connected
    await seedSuperAdmin(); // 2️⃣ Seed check + insert

    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use("/api", routes);
    app.use("/api/sales", salesRoutes);
    app.use("/api/attendance", attendanceRoutes);
    app.use("/api/password", passwordRoutes);

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Server failed to start", error);
  }
};

startServer();
