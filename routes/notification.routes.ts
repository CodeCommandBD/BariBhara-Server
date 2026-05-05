import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  generateReceiptPDF,
  sendReceiptByEmail,
  sendRentReminders,
  sendLeaseExpiryNotifications,
} from "../controller/notification.controller.js";

const notificationRouter = express.Router();

// ১. পেমেন্ট রিসিট PDF ডাউনলোড
notificationRouter.get("/receipt/pdf/:transactionId", isAuthenticated, generateReceiptPDF);

// ২. রিসিট ইমেইলে পাঠানো
notificationRouter.post("/receipt/email/:transactionId", isAuthenticated, sendReceiptByEmail);

// ৩. ভাড়া বাকির রিমাইন্ডার (বাল্ক)
notificationRouter.post("/reminder/rent", isAuthenticated, sendRentReminders);

// ৪. লিজ এক্সপায়ারি নোটিফিকেশন (বাল্ক)
notificationRouter.post("/reminder/lease", isAuthenticated, sendLeaseExpiryNotifications);

export default notificationRouter;
