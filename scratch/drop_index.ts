import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL as string);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not found");

    // fullName ইনডেক্সটি ড্রপ করা
    try {
        await db.collection("users").dropIndex("fullName_1");
        console.log("🚀 'fullName_1' index dropped successfully!");
    } catch (e) {
        console.log("⚠️ Index might not exist or already dropped.");
    }

    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error dropping index:", error);
    process.exit(1);
  }
};

dropIndex();
