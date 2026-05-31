import type { Request, Response } from "express";
import User from "../models/user.model.js";
import webpush from "web-push";

// VAPID keys setup (ensure these are in your .env)
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@baribhara.com";

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export const subscribeToPush = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        const subscription = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ success: false, message: "Invalid subscription payload" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Check if subscription already exists
        const exists = user.pushSubscriptions.some(
            (sub: any) => sub.endpoint === subscription.endpoint
        );

        if (!exists) {
            user.pushSubscriptions.push(subscription);
            await user.save();
        }

        res.status(200).json({ success: true, message: "Subscribed to push notifications" });
    } catch (error: any) {
        console.error("Push Subscription Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const unsubscribeFromPush = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { endpoint } = req.body;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

        await User.findByIdAndUpdate(userId, {
            $pull: { pushSubscriptions: { endpoint: endpoint } }
        });

        res.status(200).json({ success: true, message: "Unsubscribed successfully" });
    } catch (error: any) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

export const getVapidKey = (req: Request, res: Response) => {
    res.status(200).json({ publicKey: vapidPublicKey });
};

// Utility function to be used by other controllers to send notifications
export const sendPushNotification = async (userId: string, payload: any) => {
    try {
        if (!vapidPublicKey) return;
        
        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) return;

        const validSubscriptions = [];

        for (const sub of user.pushSubscriptions) {
            try {
                await webpush.sendNotification(sub, JSON.stringify(payload));
                validSubscriptions.push(sub);
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription has expired or is no longer valid, we will remove it
                    console.log("Subscription expired, removing...");
                } else {
                    validSubscriptions.push(sub);
                    console.error("Error sending push:", error);
                }
            }
        }

        // Update with only valid subscriptions
        if (validSubscriptions.length !== user.pushSubscriptions.length) {
            user.pushSubscriptions = validSubscriptions;
            await user.save();
        }

    } catch (error) {
        console.error("Send Push Notification Error:", error);
    }
};
