import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: [true, "পেমেন্টের পরিমাণ আবশ্যক"],
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bkash", "Nagad", "Bank", "Other"],
    default: "Cash",
  },
  transactionId: {
    type: String, // বিকাশ বা নগদের ট্রানজেকশন আইডি (ঐচ্ছিক)
    trim: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
