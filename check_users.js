import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
  console.error("Error: MONGODB_URL is not set in environment variables!");
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  fullName: String,
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

    const landlords = await User.find({ role: "landlord" });
    console.log("All Landlords in DB:");
    landlords.forEach(u => {
      console.log(`- Name: ${u.fullName}, Status: ${u.subscriptionStatus}, ExpiresAt: ${u.subscriptionExpiresAt}`);
    });
  } catch (error) {
    console.error("Error reading landlords:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
