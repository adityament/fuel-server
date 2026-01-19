
import bcrypt from "bcryptjs";
import User from "./models/userModel";

export const seedSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "superadmin" });

    if (existingSuperAdmin) {
      console.log("Superadmin already exists, skipping seed");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPERADMIN_PASSWORD as string,
      10
    );

    await User.create({
      username: process.env.SUPERADMIN_USERNAME || "Super Admin",
      email: process.env.SUPERADMIN_EMAIL,
      password: hashedPassword,
      phone: process.env.SUPERADMIN_PHONE || "9999999999",
      role: "superadmin"
    });

    console.log("Superadmin seeded successfully");
  } catch (error) {
    console.error("❌ Superadmin seeding failed", error);
  }
};
