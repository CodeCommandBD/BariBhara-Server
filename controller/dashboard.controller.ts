import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Property from "../models/property.model.js";
import Unit from "../models/unit.model.js";
import Invoice from "../models/invoice.model.js";
import Transaction from "../models/transaction.model.js";
import Tenant from "../models/tenant.model.js";

// ১. মেইন ড্যাশবোর্ড স্ট্যাটস (Property, Unit, Revenue, Occupancy)
export const getLandlordStats = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // মোট প্রপার্টি
    const totalProperties = await Property.countDocuments({ owner: ownerObjectId });

    // প্রপার্টি আইডি লিস্ট
    const propertyIds = await Property.find({ owner: ownerObjectId }).distinct("_id");

    // মোট ইউনিট
    const totalUnits = await Unit.countDocuments({ property: { $in: propertyIds } });

    // ভাড়া হওয়া ইউনিট
    const rentedUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
      status: "ভাড়া হয়েছে",
    });

    // খালি ইউনিট
    const availableUnits = totalUnits - rentedUnits;

    // অকুপেন্সি রেট
    const occupancyRate = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;

    // এই মাসের মোট কালেকশন (Invoice থেকে)
    const now = new Date();
    const currentMonth = now.toLocaleString("en-us", { month: "long" });
    const currentYear = now.getFullYear();

    const monthlyRevenueData = await Invoice.aggregate([
      { $match: { owner: ownerObjectId, month: currentMonth, year: currentYear } },
      { $group: { _id: null, totalCollected: { $sum: "$paidAmount" } } },
    ]);
    const totalRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].totalCollected : 0;

    // মোট বকেয়া (Due)
    const totalDueData = await Invoice.aggregate([
      { $match: { owner: ownerObjectId, status: { $ne: "Paid" } } },
      { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } },
    ]);
    const totalDue = totalDueData.length > 0 ? totalDueData[0].totalDue : 0;

    res.status(200).json({
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
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. গত ৬ মাসের আয়ের ট্রেন্ড (Revenue Chart এর জন্য)
export const getRevenueAnalytics = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
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
    const revenueData = [];

    // গত ৬ মাসের ডাটা বের করা
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      const result = await Invoice.aggregate([
        { $match: { owner: ownerObjectId, month, year } },
        { $group: { _id: null, revenue: { $sum: "$paidAmount" }, due: { $sum: "$dueAmount" } } },
      ]);

      revenueData.push({
        month: monthsBn[date.getMonth()],
        revenue: result.length > 0 ? result[0].revenue : 0,
        due: result.length > 0 ? result[0].due : 0,
      });
    }

    res.status(200).json({ success: true, revenueData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. সাম্প্রতিক ট্রানজেকশন (Activity Table এর জন্য)
export const getRecentTransactions = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const transactions = await Transaction.find({ owner: ownerObjectId })
      .populate("tenant", "name photo")
      .populate({ path: "invoice", populate: { path: "property unit", select: "name unitName" } })
      .sort({ paymentDate: -1 })
      .limit(7);

    res.status(200).json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. লিজ এক্সপায়ারি অ্যালার্ট (আগামী ৩০ দিনের মধ্যে লিজ শেষ হবে)
export const getLeaseExpiryAlerts = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
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

    res.status(200).json({ success: true, expiringTenants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
