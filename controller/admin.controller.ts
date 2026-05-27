import type { Request, Response } from "express";
import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import Subscription from "../models/subscription.model.js";
import Maintenance from "../models/maintenance.model.js";
import Invoice from "../models/invoice.model.js";

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalLandlords = await User.countDocuments({ role: "landlord" });
        const totalTenants = await User.countDocuments({ role: "tenant" });
        const totalProperties = await Property.countDocuments();
        const pendingSubscriptions = await Subscription.countDocuments({ status: "pending" });
        const totalMaintenanceRequests = await Maintenance.countDocuments();
        const totalInvoices = await Invoice.countDocuments();

        // Calculate total revenue from approved subscriptions
        const approvedSubscriptions = await Subscription.find({ status: "approved" });
        const totalRevenue = approvedSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

        // Fetch recent 5 users
        const recentUsers = await User.find({ role: { $in: ["landlord", "tenant"] } })
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch recent 5 subscription attempts
        const recentSubscriptions = await Subscription.find()
            .populate("userId", "fullName email phone")
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch some monthly subscription stats (mocked or aggregated from DB)
        // Group by month/year for the last 6 months
        const monthlyStats = await Subscription.aggregate([
            { $match: { status: "approved" } },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1 } },
            { $limit: 6 }
        ]);

        res.status(200).json({
            stats: {
                totalLandlords,
                totalTenants,
                totalProperties,
                pendingSubscriptions,
                totalRevenue,
                totalMaintenanceRequests,
                totalInvoices
            },
            recentUsers,
            recentSubscriptions,
            monthlyStats
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const role = req.query.role; // optional filter
        const query: any = {};
        if (role) {
            query.role = role;
        } else {
            query.role = { $in: ["landlord", "tenant"] }; // Exclude admins from the list by default
        }

        const users = await User.find(query).select("-password").sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "blocked"].includes(status)) {
            res.status(400).json({ message: "Invalid status. Must be 'active' or 'blocked'." });
            return;
        }

        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.role === "admin") {
            res.status(403).json({ message: "Cannot modify admin account status." });
            return;
        }

        user.accountStatus = status;
        await user.save();

        res.status(200).json({ message: `User account has been ${status}.` });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUserVerification = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        if (!["unverified", "pending", "verified"].includes(isVerified)) {
            res.status(400).json({ message: "Invalid verification status." });
            return;
        }

        const user = await User.findById(id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        user.isVerified = isVerified;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: isVerified === "verified" 
                ? "বাড়িওয়ালার প্রোফাইল সফলভাবে ভেরিফাই করা হয়েছে!" 
                : "বাড়িওয়ালার ভেরিফিকেশন বাতিল করা হয়েছে।" 
        });
    } catch (error) {
        console.error("Error updating verification status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ৫. Admin Revenue Stats — Platform-wide payout & revenue tracking
export const getAdminRevenueStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // সাবস্ক্রিপশন ডাটা
        const allApprovedSubs = await Subscription.find({ status: "approved" });
        const totalRevenue = allApprovedSubs.reduce((sum, s) => sum + s.amount, 0);

        // প্ল্যান ডিস্ট্রিবিউশন
        const planDist = await Subscription.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: "$plan", count: { $sum: 1 }, revenue: { $sum: "$amount" } } },
        ]);

        // গত ১২ মাসের মাসিক রেভিনিউ ট্রেন্ড
        const months: any[] = [];
        const now = new Date();
        const monthNames = ["জান", "ফেব", "মার", "এপ্র", "মে", "জুন", "জুল", "আগ", "সেপ", "অক্ট", "নভ", "ডিস"];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const subs = await Subscription.find({ status: "approved", createdAt: { $gte: start, $lte: end } });
            const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end }, role: { $ne: "admin" } });
            months.push({
                month: `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`,
                revenue: subs.reduce((sum, s) => sum + s.amount, 0),
                newUsers,
                subscriptions: subs.length,
            });
        }

        // Active subscriptions count
        const activeSubscribers = await User.countDocuments({ subscriptionStatus: "active" });

        // Top 10 paying landlords
        const topLandlords = await Subscription.aggregate([
            { $match: { status: "approved" } },
            { $group: { _id: "$userId", totalPaid: { $sum: "$amount" }, count: { $sum: 1 } } },
            { $sort: { totalPaid: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { "user.fullName": 1, "user.email": 1, "user.subscriptionPlan": 1, totalPaid: 1, count: 1, _id: 0 } },
        ]);

        // Platform-wide stats
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
        const totalLandlords = await User.countDocuments({ role: "landlord" });
        const totalTenants = await User.countDocuments({ role: "tenant" });
        const totalProperties = await Property.countDocuments();

        // MRR — current month revenue
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthSubs = await Subscription.find({ status: "approved", createdAt: { $gte: startOfMonth } });
        const mrr = currentMonthSubs.reduce((sum, s) => sum + s.amount, 0);

        res.status(200).json({
            success: true,
            revenue: {
                totalRevenue,
                mrr,
                activeSubscribers,
                planDistribution: planDist,
                monthlyTrend: months,
                topLandlords,
                platformStats: {
                    totalUsers,
                    totalLandlords,
                    totalTenants,
                    totalProperties,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching admin revenue stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
