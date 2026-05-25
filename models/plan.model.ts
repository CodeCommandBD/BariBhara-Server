import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ["free", "pro"],
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  billingCycle: {
    type: String,
    default: "monthly",
  },
  features: [
    {
      type: String,
    }
  ],
  limits: {
    maxProperties: {
      type: Number,
      required: true,
    },
    maxTenants: {
      type: Number,
      required: true,
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
