import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

// ১. আমার সব নোটিফিকেশন আনা
export const getMyNotifications = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ২. সব নোটিফিকেশন পড়া হয়েছে বলে মার্ক করা
export const markAllRead = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "সব নোটিফিকেশন পড়া হয়েছে।" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ৩. একটি নির্দিষ্ট নোটিফিকেশন পড়া
export const markOneRead = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ৪. সব নোটিফিকেশন মুছে ফেলা
export const clearAllNotifications = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    await Notification.deleteMany({ recipient: userId });
    res.json({ success: true, message: "সব নোটিফিকেশন মুছে ফেলা হয়েছে।" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
