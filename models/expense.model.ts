import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    title: {
      type: String,
      required: [true, "খরচের বিবরণ আবশ্যক"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["মেরামত", "রক্ষণাবেক্ষণ", "পরিষ্কার", "ইলেকট্রিক্যাল", "প্লাম্বিং", "অন্যান্য"],
      default: "অন্যান্য",
    },
    amount: {
      type: Number,
      required: [true, "খরচের পরিমাণ আবশ্যক"],
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
