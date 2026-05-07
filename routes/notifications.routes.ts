import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import {
  getMyNotifications,
  markAllRead,
  markOneRead,
  clearAllNotifications,
} from "../controller/notification.controller.js";

const notificationRouter = express.Router();

// ১. আমার সব নোটিফিকেশন
notificationRouter.get("/", isAuthenticated, getMyNotifications);

// ২. সব পড়া হয়েছে মার্ক
notificationRouter.patch("/read-all", isAuthenticated, markAllRead);

// ৩. একটি পড়া হয়েছে মার্ক
notificationRouter.patch("/:id/read", isAuthenticated, markOneRead);

// ৪. সব মুছে ফেলা
notificationRouter.delete("/clear", isAuthenticated, clearAllNotifications);

export default notificationRouter;
