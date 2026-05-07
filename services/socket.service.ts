import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import Notification from "../models/notification.model.js";

// ====================================================
// Singleton Socket.io instance
// ====================================================
let io: SocketServer | null = null;

// userId → socketId[] ম্যাপিং (একজন user একাধিক ট্যাবে থাকতে পারে)
const userSockets = new Map<string, Set<string>>();

// ====================================================
// Socket Server Initialize (src/index.ts থেকে কল হবে)
// ====================================================
export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client লগইন করলে নিজের userId পাঠায়
    socket.on("register", (userId: string) => {
      if (!userId) return;

      // userId → socket map এ যোগ করা
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);

      // নিজের room এ join করা
      socket.join(`user:${userId}`);
      console.log(`✅ User ${userId} registered → socket ${socket.id}`);
    });

    // Disconnect হলে map থেকে সরানো
    socket.on("disconnect", () => {
      userSockets.forEach((sockets, userId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      });
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });

    // Client notification পড়েছে বলে জানালে
    socket.on("mark_read", async (notificationId: string) => {
      try {
        await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });
  });

  return io;
};

// ====================================================
// getIO — যেকোনো জায়গা থেকে io access করার জন্য
// ====================================================
export const getIO = (): SocketServer => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

// ====================================================
// Notification পাঠানো + DB তে সেভ করা
// ====================================================
export interface NotificationPayload {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  meta?: {
    invoiceId?: string;
    tenantId?: string;
    propertyId?: string;
    amount?: number;
    url?: string;
  };
}

export const emitNotification = async (payload: NotificationPayload): Promise<void> => {
  try {
    // ১. DB তে সেভ করা
    const notification = (await Notification.create({
      recipient: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      meta: payload.meta ?? {},
    })) as any;

    // ২. Real-time socket emit (user যদি online থাকে)
    if (io) {
      io.to(`user:${payload.recipientId}`).emit("new_notification", {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        meta: notification.meta,
        isRead: false,
        createdAt: notification.createdAt,
      });
    }
  } catch (err) {
    console.error("emitNotification error:", err);
  }
};

// ====================================================
// Helper — কতজন user এখন online
// ====================================================
export const getOnlineUsers = (): number => userSockets.size;
