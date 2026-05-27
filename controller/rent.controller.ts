import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Invoice from "../models/invoice.model.js";
import Transaction from "../models/transaction.model.js";
import Tenant from "../models/tenant.model.js";
import Property from "../models/property.model.js";
import Unit from "../models/unit.model.js";
import User from "../models/user.model.js";
import { clearDashboardCache } from "./dashboard.controller.js";
import { generateInvoicePDF, generateInvoiceNumber } from "../services/pdf.service.js";
import { sendPaymentReceiptEmail } from "../services/email.service.js";
import { sendNotification } from "../services/socket.service.js";
import { whatsappService } from "../services/whatsapp.service.js";
import { v2 as cloudinary } from "cloudinary";

// ক্লাউডিনারি কনফিগারেশন (যদি দরকার হয়, অন্যথায় অটোমেটিক ডট এনভ থেকে নিবে)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// ১. নতুন ইনভয়েস/বিল তৈরি করা (Manual Generate)
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
      return res.status(400).json({ success: false, message: "অবৈধ ভাড়াটিয়া আইডি!" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }
    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই ভাড়াটিয়ার বিল তৈরি করার অনুমতিপ্রাপ্ত নন!" });
    }

    const existingInvoice = await Invoice.findOne({ tenant: tenantId, month, year });
    if (existingInvoice) {
      return res.status(400).json({ success: false, message: "এই মাসের বিল ইতোমধ্যে তৈরি করা হয়েছে!" });
    }

    const baseRent = Number(tenant.rentAmount) || 0;
    const totalAmount = 
      baseRent + 
      (Number(waterBill) || 0) + 
      (Number(gasBill) || 0) + 
      (Number(electricityBill) || 0) + 
      (Number(serviceCharge) || 0) + 
      (Number(otherBill) || 0);

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

    // WhatsApp Notification
    if (tenant.phone) {
      const message = `সালাম ${tenant.name},\nআপনার ${month} ${year} মাসের বিল তৈরি করা হয়েছে।\nমোট পরিমাণ: ${totalAmount} BDT\nশেষ তারিখ: ${dueDate ? new Date(dueDate).toLocaleDateString('bn-BD') : 'N/A'}\nধন্যবাদ।`;
      whatsappService.sendMessage(tenant.phone, message);
    }

    res.status(201).json({
      success: true,
      message: `${month} মাসের বিল সফলভাবে তৈরি করা হয়েছে!`,
      invoice: newInvoice,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. পেমেন্ট গ্রহণ করা + PDF তৈরি + ইমেইল পাঠানো
export const collectPayment = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { invoiceId, amount, paymentMethod, transactionId, note, paymentDate } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(String(invoiceId))) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    // ইনভয়েস সব related data সহ load করা
    const invoice = await Invoice.findById(invoiceId)
      .populate("tenant", "name phone email")
      .populate("property", "name")
      .populate("unit", "unitName");

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

    // ইনভয়েস আপডেট করা
    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newDueAmount = invoice.totalAmount - newPaidAmount;
    let status = "Partial";
    if (newDueAmount <= 0) status = "Paid";
    if (newPaidAmount === 0) status = "Unpaid";

    await Invoice.findByIdAndUpdate(invoiceId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount < 0 ? 0 : newDueAmount,
      status,
    });

    // Dashboard cache clear
    clearDashboardCache(ownerId);

    // ১️⃣ Real-time Notification
    await sendNotification({
      recipient: ownerId,
      type: "payment",
      title: "পেমেন্ট গৃহীত হয়েছে! ✅",
      message: `${(invoice.tenant as any)?.name} থেকে ${paymentAmount.toLocaleString()} টাকা গ্রহণ করা হয়েছে — ${invoice.month} ${invoice.year}`,
      link: "/payments",
    });

    // ২️⃣ ভাড়াটিয়াকে নোটিফিকেশন পাঠানো
    await sendNotification({
      recipient: String((invoice.tenant as any)?._id),
      type: "payment",
      title: "পেমেন্ট কনফার্মেশন 💰",
      message: `আপনার ${invoice.month} মাসের ${paymentAmount.toLocaleString()} টাকা পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে।`,
      link: "/tenant/invoices",
    });

    // ====================================================
    // PDF তৈরি এবং ইমেইল পাঠানো (background এ)
    // ====================================================
    const tenant = invoice.tenant as any;
    const property = invoice.property as any;
    const unit = invoice.unit as any;
    const invoiceNumber = generateInvoiceNumber(invoiceId);

    // Owner এর নাম আনা
    const owner = await User.findById(ownerId).select("name");

    if (tenant?.email) {
      // Non-blocking — PDF + email background এ চলবে
      (async () => {
        try {
          const pdfBuffer = await generateInvoicePDF({
            invoiceNumber,
            tenantName: tenant.name ?? "N/A",
            tenantPhone: tenant.phone ?? "N/A",
            propertyName: property?.name ?? "N/A",
            unitName: unit?.unitName ?? "N/A",
            month: invoice.month,
            year: invoice.year,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            paymentMethod: paymentMethod ?? "Cash",
            transactionId,
            baseRent: invoice.baseRent ?? 0,
            waterBill: invoice.waterBill ?? 0,
            gasBill: invoice.gasBill ?? 0,
            electricityBill: invoice.electricityBill ?? 0,
            serviceCharge: invoice.serviceCharge ?? 0,
            otherBill: invoice.otherBill ?? 0,
            totalAmount: invoice.totalAmount,
            paidAmount: newPaidAmount,
            dueAmount: Math.max(0, newDueAmount),
            ownerName: (owner as any)?.fullName ?? "মালিক",
            status: (newDueAmount <= 0 ? "Paid" : "Partial") as "Paid" | "Partial",
          });

          // Cloudinary তে আপলোড
          const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                resource_type: "raw",
                folder: "invoices",
                public_id: `${invoiceNumber}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result?.secure_url);
              }
            );
            stream.end(pdfBuffer);
          });

          const cloudinaryUrl = await uploadPromise;

          // ইনভয়েস এ PDF URL সেভ করা
          await Invoice.findByIdAndUpdate(invoiceId, { pdfUrl: cloudinaryUrl });

          await sendPaymentReceiptEmail({
            tenantEmail: tenant.email,
            tenantName: tenant.name,
            amount: paymentAmount,
            paymentMethod,
            transactionId,
            propertyName: property?.name ?? "N/A",
            unitName: unit?.unitName ?? "N/A",
            month: invoice.month,
            year: invoice.year,
            paidDate: paymentDate ? new Date(paymentDate) : new Date(),
            remainingDue: Math.max(0, newDueAmount),
            pdfBuffer,
            invoiceNumber,
          });

          // WhatsApp এও PDF লিঙ্ক পাঠানো (যদি সম্ভব হয়)
          if (tenant?.phone && cloudinaryUrl) {
            const msg = `আপনার ${invoice.month} মাসের ইনভয়েস ডাউনলোড লিঙ্ক: ${cloudinaryUrl}`;
            whatsappService.sendMessage(tenant.phone, msg);
          }
        } catch (emailErr) {
          console.error("PDF/Email/Cloudinary Error:", emailErr);
        }
      })();
    }

    // WhatsApp Notification
    if (tenant?.phone) {
      const message = `সালাম ${tenant.name},\nআপনার ${invoice.month} ${invoice.year} মাসের পেমেন্ট সফলভাবে গৃহীত হয়েছে।\nপরিমাণ: ${paymentAmount} BDT\nঅবশিষ্ট বকেয়া: ${Math.max(0, newDueAmount)} BDT\nধন্যবাদ।`;
      whatsappService.sendMessage(tenant.phone, message);
    }

    res.status(200).json({
      success: true,
      message: "পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!",
      invoiceNumber,
      transaction,
      pdfAvailable: true,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. PDF Invoice Download Endpoint
export const downloadInvoicePDF = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { invoiceId } = req.params;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(String(invoiceId))) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("tenant", "name phone email")
      .populate("property", "name")
      .populate("unit", "unitName");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "ইনভয়েস পাওয়া যায়নি!" });
    }
    if (String(invoice.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই ইনভয়েস দেখার অনুমতি নেই!" });
    }

    const tenant = invoice.tenant as any;
    const property = invoice.property as any;
    const unit = invoice.unit as any;
    const owner = await User.findById(ownerId).select("fullName");
    const invoiceNumber = generateInvoiceNumber(String(invoiceId));

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      tenantName: tenant?.name ?? "N/A",
      tenantPhone: tenant?.phone ?? "N/A",
      propertyName: property?.name ?? "N/A",
      unitName: unit?.unitName ?? "N/A",
      month: invoice.month,
      year: invoice.year,
      paymentDate: new Date(),
      paymentMethod: "Manual",
      baseRent: invoice.baseRent ?? 0,
      waterBill: invoice.waterBill ?? 0,
      gasBill: invoice.gasBill ?? 0,
      electricityBill: invoice.electricityBill ?? 0,
      serviceCharge: invoice.serviceCharge ?? 0,
      otherBill: invoice.otherBill ?? 0,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: Math.max(0, invoice.dueAmount),
      ownerName: (owner as any)?.fullName ?? "মালিক",
      status: invoice.status as "Paid" | "Partial" | "Unpaid",
    });

    // PDF response পাঠানো
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. সব ইনভয়েস — স্ট্যাটাস ফিল্টার সহ (Pagination)
export const getPendingInvoices = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const statusFilter = req.query.status as string; // "all" | "Unpaid" | "Partial" | "Paid"
    const monthFilter = req.query.month as string;
    const yearFilter = req.query.year as string;

    const baseFilter: any = { owner: new mongoose.Types.ObjectId(ownerId) };

    if (statusFilter && statusFilter !== "all") {
      baseFilter.status = statusFilter;
    }
    if (monthFilter) baseFilter.month = monthFilter;
    if (yearFilter) baseFilter.year = Number(yearFilter);

    // Aggregated stats (always across all statuses)
    const statsFilter = { owner: new mongoose.Types.ObjectId(ownerId) };
    const [invoices, total, stats] = await Promise.all([
      Invoice.find(baseFilter)
        .populate("tenant", "name phone email")
        .populate("unit", "unitName")
        .populate("property", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(baseFilter),
      Invoice.aggregate([
        { $match: statsFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalDue: { $sum: "$dueAmount" },
          },
        },
      ]),
    ]);

    // Build stats map
    const statsMap: Record<string, any> = { Unpaid: { count: 0, totalDue: 0 }, Partial: { count: 0, totalDue: 0 }, Paid: { count: 0, totalDue: 0 } };
    stats.forEach((s) => { if (statsMap[s._id]) statsMap[s._id] = { count: s.count, totalDue: s.totalDue }; });

    res.status(200).json({
      success: true,
      invoices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: statsMap,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. নির্দিষ্ট ভাড়াটিয়ার ভাড়ার ইতিহাস (Rent History)
export const getTenantRentHistory = async (req: Req, res: Res) => {
  try {
    const tenantId = req.params.tenantId as string;
    if (!tenantId || !mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ভাড়াটিয়া আইডি!" });
    }

    const invoices = await Invoice.find({ tenant: new mongoose.Types.ObjectId(tenantId) })
      .sort({ year: -1, createdAt: -1 });

    res.status(200).json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৬. নির্দিষ্ট ইনভয়েসের সব পেমেন্ট হিস্টোরি
export const getInvoiceTransactions = async (req: Req, res: Res) => {
  try {
    const invoiceId = req.params.invoiceId as string;
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(String(invoiceId))) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const transactions = await Transaction.find({ invoice: new mongoose.Types.ObjectId(invoiceId) })
      .sort({ paymentDate: -1 });
      
    res.status(200).json({ success: true, transactions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৭. ইনভয়েস এডিট করা (শুধুমাত্র Unpaid স্ট্যাটাসের জন্য)
export const editInvoice = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const invoiceId = req.params.invoiceId as string;
    const { waterBill, gasBill, electricityBill, serviceCharge, otherBill, dueDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, owner: ownerId });
    if (!invoice) return res.status(404).json({ success: false, message: "ইনভয়েস পাওয়া যায়নি!" });

    if (invoice.status !== "Unpaid") {
      return res.status(400).json({ success: false, message: "পেমেন্ট গ্রহণ করা বিল এডিট করা সম্ভব নয়।" });
    }

    const totalAmount = invoice.baseRent + Number(waterBill || 0) + Number(gasBill || 0) + Number(electricityBill || 0) + Number(serviceCharge || 0) + Number(otherBill || 0);

    invoice.waterBill = Number(waterBill || 0);
    invoice.gasBill = Number(gasBill || 0);
    invoice.electricityBill = Number(electricityBill || 0);
    invoice.serviceCharge = Number(serviceCharge || 0);
    invoice.otherBill = Number(otherBill || 0);
    invoice.totalAmount = totalAmount;
    invoice.dueAmount = totalAmount; // Because it's unpaid
    if (dueDate) invoice.dueDate = new Date(dueDate);

    await invoice.save();
    clearDashboardCache(ownerId);

    res.status(200).json({ success: true, message: "বিল সফলভাবে আপডেট হয়েছে!", invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৮. ইনভয়েস ডিলিট করা (শুধুমাত্র Unpaid স্ট্যাটাসের জন্য)
export const deleteInvoice = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const invoiceId = req.params.invoiceId as string;

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইনভয়েস আইডি!" });
    }

    const invoice = await Invoice.findOne({ _id: invoiceId, owner: ownerId });
    if (!invoice) return res.status(404).json({ success: false, message: "ইনভয়েস পাওয়া যায়নি!" });

    if (invoice.status !== "Unpaid") {
      return res.status(400).json({ success: false, message: "পেমেন্ট গ্রহণ করা বিল ডিলিট করা সম্ভব নয়।" });
    }

    await invoice.deleteOne();
    clearDashboardCache(ownerId);

    res.status(200).json({ success: true, message: "বিল সফলভাবে বাতিল করা হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
