import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Property from "../models/property.model.js";
import Unit from "../models/unit.model.js";
import Invoice from "../models/invoice.model.js";
import Transaction from "../models/transaction.model.js";
import Tenant from "../models/tenant.model.js";
import { cache, CACHE_TTL } from "../services/cache.service.js";

// ১. মেইন ড্যাশবোর্ড স্ট্যাটস (Property, Unit, Revenue, Occupancy)
export const getLandlordStats = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const cacheKey = `dashboard_stats:${ownerId}`;

    // ক্যাশ চেক করা
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached as object, _cached: true });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // সব query সমান্তরালে চালানো (Promise.all দিয়ে দ্রুত)
    const propertyIds = await Property.find({ owner: ownerObjectId }).distinct("_id");

    const [
      totalProperties,
      totalUnits,
      rentedUnits,
      monthlyRevenueData,
      totalDueData,
    ] = await Promise.all([
      Property.countDocuments({ owner: ownerObjectId }),
      Unit.countDocuments({ property: { $in: propertyIds } }),
      Unit.countDocuments({ property: { $in: propertyIds }, status: "ভাড়া হয়েছে" }),
      Invoice.aggregate([
        {
          $match: {
            owner: ownerObjectId,
            month: new Date().toLocaleString("en-us", { month: "long" }),
            year: new Date().getFullYear(),
          },
        },
        { $group: { _id: null, totalCollected: { $sum: "$paidAmount" } } },
      ]),
      Invoice.aggregate([
        { $match: { owner: ownerObjectId, status: { $ne: "Paid" } } },
        { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } },
      ]),
    ]);

    const availableUnits = totalUnits - rentedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
    const totalRevenue = monthlyRevenueData[0]?.totalCollected ?? 0;
    const totalDue = totalDueData[0]?.totalDue ?? 0;

    const responseData = {
      success: true,
      stats: {
        totalProperties,
        totalUnits,
        rentedUnits,
        availableUnits,
        totalRevenue,
        totalDue,
        occupancyRate,
      },
    };

    // ক্যাশে সেভ করা
    cache.set(cacheKey, responseData, CACHE_TTL.DASHBOARD_STATS);

    res.status(200).json(responseData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. গত ৬ মাসের আয়ের ট্রেন্ড (Revenue Chart এর জন্য)
export const getRevenueAnalytics = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const cacheKey = `revenue_analytics:${ownerId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached as object, _cached: true });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthsBn = [
      "জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন",
      "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে",
    ];

    const now = new Date();

    // গত ৬ মাসের জন্য সব query একসাথে চালানো
    const monthQueries = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return {
        label: monthsBn[date.getMonth()],
        query: Invoice.aggregate([
          { $match: { owner: ownerObjectId, month, year } },
          { $group: { _id: null, revenue: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" } } },
        ]),
      };
    });

    const results = await Promise.all(monthQueries.map((m) => m.query));
    const revenueData = monthQueries.map((m, i) => {
      const row = results[i]?.[0] as { revenue?: number; due?: number } | undefined;
      return {
        month: m.label,
        revenue: row?.revenue ?? 0,
        due: row?.due ?? 0,
      };
    });

    const responseData = { success: true, revenueData };
    cache.set(cacheKey, responseData, CACHE_TTL.REVENUE_ANALYTICS);

    res.status(200).json(responseData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. সাম্প্রতিক ট্রানজেকশন (Activity Table এর জন্য)
export const getRecentTransactions = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const cacheKey = `recent_transactions:${ownerId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached as object, _cached: true });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const transactions = await Transaction.find({ owner: ownerObjectId })
      .populate("tenant", "name photo")
      .populate({ path: "invoice", populate: { path: "property unit", select: "name unitName" } })
      .sort({ paymentDate: -1 })
      .limit(7);

    const responseData = { success: true, transactions };
    cache.set(cacheKey, responseData, CACHE_TTL.RECENT_TRANSACTIONS);

    res.status(200).json(responseData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. লিজ এক্সপায়ারি অ্যালার্ট (আগামী ৩০ দিনের মধ্যে লিজ শেষ হবে)
export const getLeaseExpiryAlerts = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const cacheKey = `lease_alerts:${ownerId}`;

    const cached = cache.get(cacheKey);
    if (cached) {
      return res.status(200).json({ ...cached as object, _cached: true });
    }

    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const expiringTenants = await Tenant.find({
      owner: ownerObjectId,
      status: "সক্রিয়",
      leaseEnd: { $gte: today, $lte: in30Days },
    })
      .populate("unit", "unitName")
      .populate("property", "name")
      .sort({ leaseEnd: 1 });

    const responseData = { success: true, expiringTenants };
    cache.set(cacheKey, responseData, CACHE_TTL.LEASE_ALERTS);

    res.status(200).json(responseData);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. ক্যাশ ম্যানুয়ালি ক্লিয়ার (Admin বা নতুন পেমেন্টের পরে)
export const clearDashboardCache = (userId: string) => {
  cache.deleteByPrefix(`dashboard_stats:${userId}`);
  cache.deleteByPrefix(`revenue_analytics:${userId}`);
  cache.deleteByPrefix(`recent_transactions:${userId}`);
  cache.deleteByPrefix(`lease_alerts:${userId}`);
};
