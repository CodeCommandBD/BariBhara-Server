import type { Request as Req, Response as Res } from "express";
import Subscription from "../models/subscription.model.js";
import User from "../models/user.model.js";
import { sendNotification, notifySubscriptionUpdate } from "../services/socket.service.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

const isFakeTrxId = (trxId: string, paymentMethod: string): { isFake: boolean; reason: string } => {
    const trimmed = trxId.trim();
    
    // 1. Length checks
    if (trimmed.length < 8 || trimmed.length > 16) {
        return { isFake: true, reason: "Transaction ID length is invalid (must be between 8 and 16 characters)." };
    }

    // 2. Alphanumeric check
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(trimmed);
    if (!isAlphanumeric) {
        return { isFake: true, reason: "Transaction ID must contain only alphanumeric characters." };
    }

    // 3. Blacklisted terms
    const blacklist = ["fake", "test", "mock", "dummy", "demo", "xyz", "abc", "trx", "pay", "admin", "null", "undefined", "12345678", "abcdef"];
    const lower = trimmed.toLowerCase();
    for (const term of blacklist) {
        if (lower.includes(term)) {
            return { isFake: true, reason: `Transaction ID contains invalid mock term ("${term}").` };
        }
    }

    // 4. Repetitive patterns (e.g. AAAAAAAA, 11111111)
    if (/^(.)\1{4,}$/.test(trimmed)) {
        return { isFake: true, reason: "Transaction ID has repetitive character patterns." };
    }

    // 5. Check sequential digits
    const sequences = ["0123456", "1234567", "2345678", "3456789", "9876543", "8765432", "7654321"];
    for (const seq of sequences) {
        if (lower.includes(seq)) {
            return { isFake: true, reason: "Transaction ID contains sequential digits." };
        }
    }

    return { isFake: false, reason: "" };
};

export const createSubscriptionRequest = async (req: Req, res: Res): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { plan, amount, senderNumber, paymentMethod } = req.body;
        const trxId = (req.body.trxId && req.body.trxId.trim()) ? req.body.trxId.trim() : "";

        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.subscriptionStatus === "pending") {
            res.status(400).json({ message: "You already have a pending subscription request." });
            return;
        }

        // Check that at least one of Transaction ID or Screenshot is provided
        if (!trxId && !req.file) {
            res.status(400).json({ message: "Transaction ID or Payment Screenshot is required." });
            return;
        }

        // Automatic Fake TrxID detection & uniqueness check (only if trxId is provided)
        let status = "pending";
        let rejectionReason = "";
        let fakeCheckReason = "";

        if (trxId) {
            const existingTrx = await Subscription.findOne({ trxId });
            if (existingTrx) {
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
                res.status(400).json({ message: "This Transaction ID has already been used." });
                return;
            }

            const fakeCheck = isFakeTrxId(trxId, paymentMethod);
            if (fakeCheck.isFake) {
                status = "rejected";
                rejectionReason = `System Auto-Rejected: ${fakeCheck.reason}`;
                fakeCheckReason = fakeCheck.reason;
            }
        }

        // Upload screenshot optionally
        let screenshot = "";
        if (req.file) {
            try {
                const uploadRes = await cloudinary.uploader.upload(req.file.path, {
                    folder: "bariowla/subscriptions",
                });
                screenshot = uploadRes.secure_url;
            } catch (err) {
                console.error("Cloudinary upload failed for subscription screenshot:", err);
            } finally {
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
            }
        }

        const newSubscription = new Subscription({
            userId,
            plan,
            amount,
            senderNumber,
            paymentMethod,
            trxId: (trxId && trxId.trim()) ? trxId.trim() : undefined,
            status,
            rejectionReason,
            screenshot
        });

        await newSubscription.save();

        if (status === "rejected") {
            user.subscriptionStatus = "none";
            user.subscriptionPlan = "free";
            await user.save();

            // Send real-time notification
            await sendNotification({
                recipient: userId.toString(),
                title: "সাবস্ক্রিপশন অটো-রিজেক্টেড! 🚨",
                message: `অমান্য ট্রানজেকশন আইডি প্যাটার্নের কারণে আপনার রিকোয়েস্টটি বাতিল করা হয়েছে: ${fakeCheckReason}`,
                type: "system"
            });
            notifySubscriptionUpdate(userId.toString(), "none", "free");

            res.status(201).json({ 
                message: `Subscription auto-rejected by security validation. Reason: ${fakeCheckReason}`, 
                subscription: newSubscription,
                autoRejected: true
            });
            return;
        }

        user.subscriptionStatus = "pending";
        user.subscriptionPlan = plan;
        await user.save();

        res.status(201).json({ message: "Subscription request submitted successfully.", subscription: newSubscription });
    } catch (error) {
        console.error("Error creating subscription request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllSubscriptions = async (req: Req, res: Res): Promise<void> => {
    try {
        const subscriptions = await Subscription.find().populate("userId", "fullName email phone").sort({ createdAt: -1 });
        res.status(200).json({ subscriptions });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const approveSubscription = async (req: Req, res: Res): Promise<void> => {
    try {
        const { id } = req.params;
        const subscription = await Subscription.findById(id);

        if (!subscription) {
            res.status(404).json({ message: "Subscription not found" });
            return;
        }

        if (subscription.status !== "pending") {
            res.status(400).json({ message: "Only pending subscriptions can be approved." });
            return;
        }

        subscription.status = "approved";
        await subscription.save();

        const user = await User.findById(subscription.userId);
        if (user) {
            user.subscriptionStatus = "active";
            user.subscriptionPlan = subscription.plan;
            // Set expiry date to 30 days from now
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            user.subscriptionExpiresAt = expiryDate;
            await user.save();

            // Send real-time notifications
            await sendNotification({
                recipient: user._id.toString(),
                title: "সাবস্ক্রিপশন অ্যাক্টিভ হয়েছে! 🎉",
                message: `আপনার ${subscription.plan.toUpperCase()} মেম্বারশিপটি অ্যাডমিন সফলভাবে অ্যাপ্রুভ করেছেন। উপভোগ করুন!`,
                type: "system"
            });
            notifySubscriptionUpdate(user._id.toString(), "active", subscription.plan);
        }

        res.status(200).json({ message: "Subscription approved successfully." });
    } catch (error) {
        console.error("Error approving subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const rejectSubscription = async (req: Req, res: Res): Promise<void> => {
    try {
        const { id } = req.params;
        const subscription = await Subscription.findById(id);

        if (!subscription) {
            res.status(404).json({ message: "Subscription not found" });
            return;
        }

        if (subscription.status !== "pending") {
            res.status(400).json({ message: "Only pending subscriptions can be rejected." });
            return;
        }

        subscription.status = "rejected";
        await subscription.save();

        const user = await User.findById(subscription.userId);
        if (user) {
            // Revert status to none if they were pending
            if (user.subscriptionStatus === "pending") {
                user.subscriptionStatus = "none";
                user.subscriptionPlan = "free";
                await user.save();
            }

            // Send real-time notifications
            await sendNotification({
                recipient: user._id.toString(),
                title: "সাবস্ক্রিপশন বাতিল করা হয়েছে! ❌",
                message: "আপনার পেমেন্ট ভেরিফিকেশন রিকোয়েস্টটি রিজেক্ট করা হয়েছে। দয়া করে সঠিক ট্রানজেকশন আইডি দিয়ে পুনরায় চেষ্টা করুন।",
                type: "system"
            });
            notifySubscriptionUpdate(user._id.toString(), "none", "free");
        }

        res.status(200).json({ message: "Subscription rejected successfully." });
    } catch (error) {
        console.error("Error rejecting subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyLatestSubscription = async (req: Req, res: Res): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const subscription = await Subscription.findOne({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ subscription });
    } catch (error) {
        console.error("Error fetching latest subscription:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const activateFreePlan = async (req: Req, res: Res): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        // Set to active and free, and remove expiry limit so it is permanent
        user.subscriptionStatus = "active";
        user.subscriptionPlan = "free";
        user.subscriptionExpiresAt = null; // No expiry for free plan
        await user.save();

        // Send socket notification to update in real-time
        await sendNotification({
            recipient: user._id.toString(),
            title: "ফ্রি প্ল্যান সক্রিয় হয়েছে! 🎉",
            message: "আপনার ফ্রি মেম্বারশিপটি সফলভাবে সক্রিয় করা হয়েছে। উপভোগ করুন!",
            type: "system"
        });
        notifySubscriptionUpdate(user._id.toString(), "active", "free");

        res.status(200).json({ success: true, message: "Free plan activated successfully.", user });
    } catch (error) {
        console.error("Error activating free plan:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
