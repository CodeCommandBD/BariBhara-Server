import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  generateInvoice,
  collectPayment,
  getPendingInvoices,
  getInvoiceTransactions,
  getTenantRentHistory,
} from "../controller/rent.controller.js";

const rentRouter = express.Router();

// ১. ম্যানুয়ালি বিল জেনারেট করা
rentRouter.post("/generate", isAuthenticated, generateInvoice);

// ২. পেমেন্ট কালেক্ট করা
rentRouter.post("/collect", isAuthenticated, collectPayment);

// ৩. সব বকেয়া বিল দেখা
rentRouter.get("/pending", isAuthenticated, getPendingInvoices);

// ৪. নির্দিষ্ট ভাড়াটিয়ার ভাড়ার ইতিহাস
rentRouter.get("/history/:tenantId", isAuthenticated, getTenantRentHistory);

// ৫. নির্দিষ্ট বিলের পেমেন্ট হিস্টোরি
rentRouter.get("/transactions/:invoiceId", isAuthenticated, getInvoiceTransactions);

export default rentRouter;
