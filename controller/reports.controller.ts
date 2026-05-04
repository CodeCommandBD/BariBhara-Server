import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Invoice from "../models/invoice.model.js";
import Transaction from "../models/transaction.model.js";
import Expense from "../models/expense.model.js";
import Property from "../models/property.model.js";

// ১. ফিনান্সিয়াল রিপোর্ট (তারিখ রেঞ্জ ও প্রপার্টি অনুযায়ী ফিল্টার)
export const getFinancialReport = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
    const { startDate, endDate, propertyId } = req.query;

    // ট্রানজেকশন ফিল্টার
    const txnFilter: any = { owner: ownerObjectId };
    if (startDate || endDate) {
      txnFilter.paymentDate = {};
      if (startDate) txnFilter.paymentDate.$gte = new Date(startDate as string);
      if (endDate) txnFilter.paymentDate.$lte = new Date(endDate as string);
    }

    // ইনভয়েস ফিল্টার
    const invFilter: any = { owner: ownerObjectId };
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId as string)) {
      invFilter.property = new mongoose.Types.ObjectId(propertyId as string);
      txnFilter.invoice = { $exists: true }; // placeholder
    }

    // সব ট্রানজেকশন
    const transactions = await Transaction.find(txnFilter)
      .populate("tenant", "name phone")
      .populate({
        path: "invoice",
        populate: { path: "property unit", select: "name unitName" },
      })
      .sort({ paymentDate: -1 });

    // মোট কালেকশন
    const totalCollection = transactions.reduce((sum, t) => sum + t.amount, 0);

    // মোট বকেয়া
    const dueData = await Invoice.aggregate([
      { $match: { ...invFilter, status: { $ne: "Paid" } } },
      { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } },
    ]);
    const totalDue = dueData.length > 0 ? dueData[0].totalDue : 0;

    // মোট খরচ (Expense)
    const expFilter: any = { owner: ownerObjectId };
    if (startDate || endDate) {
      expFilter.expenseDate = {};
      if (startDate) expFilter.expenseDate.$gte = new Date(startDate as string);
      if (endDate) expFilter.expenseDate.$lte = new Date(endDate as string);
    }
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId as string)) {
      expFilter.property = new mongoose.Types.ObjectId(propertyId as string);
    }

    const expenseData = await Expense.aggregate([
      { $match: expFilter },
      { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
    ]);
    const totalExpense = expenseData.length > 0 ? expenseData[0].totalExpense : 0;

    // নেট প্রফিট = কালেকশন - খরচ
    const netProfit = totalCollection - totalExpense;

    // প্রপার্টিওয়াইজ আয়
    const propertyRevenue = await Invoice.aggregate([
      { $match: { owner: ownerObjectId } },
      {
        $group: {
          _id: "$property",
          totalCollected: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "properties",
          localField: "_id",
          foreignField: "_id",
          as: "property",
        },
      },
      { $unwind: "$property" },
      { $project: { "property.name": 1, totalCollected: 1, totalDue: 1, count: 1 } },
    ]);

    res.status(200).json({
      success: true,
      report: {
        totalCollection,
        totalDue,
        totalExpense,
        netProfit,
        transactions,
        propertyRevenue,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. প্রপার্টির তালিকা (রিপোর্ট ফিল্টারের জন্য)
export const getPropertiesForFilter = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const properties = await Property.find({
      owner: new mongoose.Types.ObjectId(ownerId),
    }).select("name");
    res.status(200).json({ success: true, properties });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
