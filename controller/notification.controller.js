import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
// ১. আমার সব নোটিফিকেশন আনা
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(limit);
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });
        res.json({ success: true, notifications, unreadCount });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ২. সব নোটিফিকেশন পড়া হয়েছে বলে মার্ক করা
export const markAllRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
        res.json({ success: true, message: "সব নোটিফিকেশন পড়া হয়েছে।" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ৩. একটি নির্দিষ্ট নোটিফিকেশন পড়া
export const markOneRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
            return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
        }
        await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { isRead: true });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ৪. সব নোটিফিকেশন মুছে ফেলা
export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await Notification.deleteMany({ recipient: userId });
        res.json({ success: true, message: "সব নোটিফিকেশন মুছে ফেলা হয়েছে।" });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
//# sourceMappingURL=notification.controller.js.map