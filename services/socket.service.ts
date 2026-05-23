import { Server } from "socket.io";
import Notification from "../models/notification.model.js";

let io: Server;
const userSockets = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*", // প্রোডাকশনে নির্দিষ্ট URL দিবেন
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    
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
export const sendNotification = async (data: {
  recipient: string;
  title: string;
  message: string;
  type: "payment" | "maintenance" | "system" | "invoice";
  link?: string;
}) => {
  try {
    // ১. ডাটাবেজে সেভ করা (Persistence)
    const notification = await Notification.create(data);

    // ২. রিয়েল-টাইম পাঠানো (যদি ইউজার অনলাইন থাকে)
    const socketId = userSockets.get(data.recipient);
    if (socketId && io) {
      io.to(socketId).emit("new_notification", notification);
    }
    
    return notification;
  } catch (error) {
    console.error("❌ Socket Notification Error:", error);
  }
};

/**
 * রিয়েল-টাইম সাবস্ক্রিপশন আপডেট নোটিফাই করার ফাংশন
 */
export const notifySubscriptionUpdate = (userId: string, status: string, plan: string) => {
  try {
    const socketId = userSockets.get(userId);
    if (socketId && io) {
      io.to(socketId).emit("subscription_status_updated", { status, plan });
      console.log(`🔌 Sent subscription_status_updated to user ${userId} -> ${status}`);
    }
  } catch (error) {
    console.error("❌ Socket Subscription Update Error:", error);
  }
};
