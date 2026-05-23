import bcrypt from "bcrypt";
import User from "../models/user.model.js";

export const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: "admin" });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                fullName: "Super Admin",
                email: "admin@baribhara.com",
                password: hashedPassword,
                phone: "01000000000",
                role: "admin",
                subscriptionStatus: "active"
            });
            console.log("✅ Default Admin created: admin@baribhara.com / admin123");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};
