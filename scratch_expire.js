import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error("Error: MONGODB_URL is not set in environment variables!");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  role: String,
  subscriptionStatus: String,
  subscriptionExpiresAt: Date,
  subscriptionPlan: String
});

const User = mongoose.model("User", userSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URL);
    console.log("Connected successfully!");

    // Mark all landlords as expired (expired 5 days ago)
    const result = await User.updateMany(
      { role: "landlord" },
      {
        $set: {
          subscriptionStatus: "expired",
          subscriptionExpiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
          subscriptionPlan: "basic"
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} landlord(s) to EXPIRED!`);
  } catch (error) {
    console.error("Error updating landlords:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
