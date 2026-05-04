import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Expense from "../models/expense.model.js";
import Property from "../models/property.model.js";

// ১. নতুন খরচ যোগ করা
export const addExpense = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { property, unit, title, category, amount, expenseDate, note } = req.body;

    if (!property || !mongoose.Types.ObjectId.isValid(property)) {
      return res.status(400).json({ success: false, message: "অবৈধ প্রপার্টি আইডি!" });
    }

    // মালিকানা যাচাই
    const targetProperty = await Property.findById(property);
    if (!targetProperty) {
      return res.status(404).json({ success: false, message: "প্রপার্টি খুঁজে পাওয়া যায়নি!" });
    }
    if (String(targetProperty.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই প্রপার্টিতে খরচ যোগ করার অনুমতি নেই!" });
    }

    const expense = new Expense({
      owner: new mongoose.Types.ObjectId(ownerId),
      property: new mongoose.Types.ObjectId(property),
      unit: unit && mongoose.Types.ObjectId.isValid(unit) ? new mongoose.Types.ObjectId(unit) : undefined,
      title,
      category,
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      note,
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: "খরচ সফলভাবে যোগ করা হয়েছে!",
      expense,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. সব খরচের তালিকা দেখা (ফিল্টার সহ)
export const getExpenses = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { propertyId, startDate, endDate } = req.query;

    const filter: any = { owner: new mongoose.Types.ObjectId(ownerId) };

    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId as string)) {
      filter.property = new mongoose.Types.ObjectId(propertyId as string);
    }

    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate as string);
      if (endDate) filter.expenseDate.$lte = new Date(endDate as string);
    }

    const expenses = await Expense.find(filter)
      .populate("property", "name")
      .populate("unit", "unitName")
      .sort({ expenseDate: -1 });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({ success: true, expenses, totalExpense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. খরচ ডিলিট করা
export const deleteExpense = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const expenseId = req.params.id as string;

    if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ success: false, message: "অবৈধ এক্সপেন্স আইডি!" });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({ success: false, message: "খরচের রেকর্ড খুঁজে পাওয়া যায়নি!" });
    }
    if (String(expense.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই অপারেশনের অনুমতি নেই!" });
    }

    await Expense.findByIdAndDelete(expenseId);
    res.status(200).json({ success: true, message: "খরচের রেকর্ড মুছে ফেলা হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
