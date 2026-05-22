import { Server } from "socket.io";
import Notification from "../models/notification.model.js";
let io;
const userSockets = new Map(); // userId -> socketId
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // প্রোডাকশনে নির্দিষ্ট URL দিবেন
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId) {
            userSockets.set(userId, socket.id);
            console.log(`📡 User Connected: ${userId} (Socket: ${socket.id})`);
        }
        socket.on("disconnect", () => {
            if (userId) {
                userSockets.delete(userId);
                console.log(`🔌 User Disconnected: ${userId}`);
            }
        });
    });
    return io;
};
/**
 * রিয়েল-টাইম নোটিফিকেশন পাঠানোর ফাংশন
 */
export const sendNotification = async (data) => {
    try {
        // ১. ডাটাবেজে সেভ করা (Persistence)
        const notification = await Notification.create(data);
        // ২. রিয়েল-টাইম পাঠানো (যদি ইউজার অনলাইন থাকে)
        const socketId = userSockets.get(data.recipient);
        if (socketId && io) {
            io.to(socketId).emit("new_notification", notification);
        }
        return notification;
    }
    catch (error) {
        console.error("❌ Socket Notification Error:", error);
    }
};
//# sourceMappingURL=socket.service.js.map