import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unit",
    required: true,
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  month: {
    type: String,
    required: [true, "মাসের নাম আবশ্যক"],
  },
  year: {
    type: Number,
    required: [true, "বছরের নাম আবশ্যক"],
  },
  baseRent: {
    type: Number,
    required: true,
  },
  waterBill: {
    type: Number,
    default: 0,
  },
  gasBill: {
    type: Number,
    default: 0,
  },
  electricityBill: {
    type: Number,
    default: 0,
  },
  serviceCharge: {
    type: Number,
    default: 0,
  },
  otherBill: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  dueAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid"],
    default: "Unpaid",
  },
  dueDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// প্রতি মাসে একই ভাড়াটিয়ার জন্য যেন ভুল করে দুইবার বিল জেনারেট না হয় (Unique Index)
invoiceSchema.index({ tenant: 1, month: 1, year: 1 }, { unique: true });

const Invoice = mongoose.model("Invoice", invoiceSchema);
export default Invoice;
