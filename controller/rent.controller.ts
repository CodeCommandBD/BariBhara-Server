import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Invoice from "../models/invoice.model.js";
import Transaction from "../models/transaction.model.js";
import Tenant from "../models/tenant.model.js";

// ১. নতুন ইনভয়েস/বিল তৈরি করা (Manual Generate)
export const generateInvoice = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { 
      tenantId, 
      month, 
      year, 
      waterBill, 
      gasBill, 
      electricityBill, 
      serviceCharge, 
      otherBill,
      dueDate 
    } = req.body;

    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ভাড়াটিয়া আইডি!" });
    }

    // ক. ভাড়াটিয়া আছে কি না এবং মালিক কি না চেক করা
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }
    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই ভাড়াটিয়ার বিল তৈরি করার অনুমতিপ্রাপ্ত নন!" });
    }

    // খ. ইতোমধ্যে এই মাসের বিল তৈরি হয়েছে কি না চেক করা
    const existingInvoice = await Invoice.findOne({ tenant: tenantId, month, year });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: "এই মাসের বিল ইতোমধ্যে তৈরি করা হয়েছে!" });
    }

    // গ. টোটাল ক্যালকুলেশন
    const baseRent = Number(tenant.rentAmount) || 0;
    const totalAmount = 
      baseRent + 
      (Number(waterBill) || 0) + 
      (Number(gasBill) || 0) + 
      (Number(electricityBill) || 0) + 
      (Number(serviceCharge) || 0) + 
      (Number(otherBill) || 0);

    // ঘ. ইনভয়েস সেভ করা
    const newInvoice = new Invoice({
      tenant: new mongoose.Types.ObjectId(tenantId),
      unit: tenant.unit,
      property: tenant.property,
      owner: new mongoose.Types.ObjectId(ownerId),
      month,
      year,
      baseRent,
      waterBill: Number(waterBill) || 0,
      gasBill: Number(gasBill) || 0,
      electricityBill: Number(electricityBill) || 0,
      serviceCharge: Number(serviceCharge) || 0,
      otherBill: Number(otherBill) || 0,
      totalAmount,
      dueAmount: totalAmount, 
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    await newInvoice.save();

    res.status(201).json({
      success: true,
      message: `${month} মাসের বিল সফলভাবে তৈরি করা হয়েছে!`,
      invoice: newInvoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. পেমেন্ট গ্রহণ করা (Collect Payment)
export const collectPayment = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { invoiceId, amount, paymentMethod, transactionId, note, paymentDate } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "ইনভয়েস খুঁজে পাওয়া যায়নি!" });
    }

    if (String(invoice.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই পেমেন্ট গ্রহণ করার অনুমতি নেই!" });
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: "পেমেন্টের পরিমাণ ০-এর বেশি হতে হবে!" });
    }

    // পেমেন্ট রেকর্ড তৈরি
    const transaction = new Transaction({
      invoice: new mongoose.Types.ObjectId(invoiceId),
      tenant: invoice.tenant,
      owner: new mongoose.Types.ObjectId(ownerId),
      amount: paymentAmount,
      paymentMethod,
      transactionId,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      note,
    });

    await transaction.save();

    // ইনভয়েস আপডেট করা
    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newDueAmount = invoice.totalAmount - newPaidAmount;
    
    let status = "Partial";
    if (newDueAmount <= 0) status = "Paid";
    if (newPaidAmount === 0) status = "Unpaid";

    await Invoice.findByIdAndUpdate(invoiceId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
      status: status,
    });

    res.status(200).json({
      success: true,
      message: "পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!",
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. মালিকের সব বকেয়া বিল (Pending Invoices)
export const getPendingInvoices = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const invoices = await Invoice.find({ 
      owner: new mongoose.Types.ObjectId(ownerId), 
      status: { $ne: "Paid" } 
    })
    .populate("tenant", "name phone")
    .populate("unit", "unitName")
    .populate("property", "name")
    .sort({ createdAt: -1 });

    res.status(200).json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. নির্দিষ্ট ভাড়াটিয়ার ভাড়ার ইতিহাস (Rent History)
export const getTenantRentHistory = async (req: Req, res: Res) => {
  try {
    const tenantId = req.params.tenantId as string;
    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ভাড়াটিয়া আইডি!" });
    }

    const invoices = await Invoice.find({ tenant: new mongoose.Types.ObjectId(tenantId) })
      .sort({ year: -1, createdAt: -1 });

    res.status(200).json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. নির্দিষ্ট ইনভয়েসের সব পেমেন্ট হিস্টোরি
export const getInvoiceTransactions = async (req: Req, res: Res) => {
  try {
    const invoiceId = req.params.invoiceId as string;
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const transactions = await Transaction.find({ invoice: new mongoose.Types.ObjectId(invoiceId) })
      .sort({ paymentDate: -1 });
      
    res.status(200).json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
