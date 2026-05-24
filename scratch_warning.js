import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL || "mongodb+srv://shantokumar:uDDmacohoojOT4XZrM814yzYRKEIAdzjGPrYc4XQ15upRVA6@cluster0.on3ofu5.mongodb.net/?appName=Bari-Bhara";

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

    // Set all landlords to active with exactly 3 days left
    const result = await User.updateMany(
      { role: "landlord" },
      {
        $set: {
          subscriptionStatus: "active",
          subscriptionExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 10), // 3 days from now
          subscriptionPlan: "basic"
        }
      }
    );

    console.log(`Successfully updated ${result.modifiedCount} landlord(s) to active with 3 days left!`);
  } catch (error) {
    console.error("Error updating landlords:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

run();
