import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Transaction from "../models/transaction.model.js";
import Invoice from "../models/invoice.model.js";
import Tenant from "../models/tenant.model.js";
import {
  sendPaymentReceiptEmail,
  sendRentReminderEmail,
  sendLeaseExpiryEmail,
} from "../services/email.service.js";

// ১. পেমেন্ট রিসিট PDF তৈরি করা
export const generateReceiptPDF = async (req: Req, res: Res) => {
  try {
    const transactionId = req.params.transactionId as string;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ট্রানজেকশন আইডি!" });
    }

    const transaction = await Transaction.findById(transactionId)
      .populate("tenant", "name phone email")
      .populate({
        path: "invoice",
        populate: { path: "property unit", select: "name unitName" },
      });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "ট্রানজেকশন খুঁজে পাওয়া যায়নি!" });
    }

    const invoice = transaction.invoice as any;
    const tenant = transaction.tenant as any;

    // PDF তৈরি শুরু
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="receipt-${transactionId.slice(-6)}.pdf"`
    );

    doc.pipe(res);

    // ===== হেডার =====
    doc.rect(0, 0, 595, 120).fill("#702ae1");
    doc
      .fillColor("white")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("BARIOWLA", 50, 35);
    doc
      .fillColor("rgba(255,255,255,0.8)")
      .font("Helvetica")
      .fontSize(12)
      .text("Property Management System", 50, 68);
    doc
      .fillColor("white")
      .fontSize(12)
      .text("PAYMENT RECEIPT", 350, 45, { align: "right", width: 195 })
      .fontSize(10)
      .text(`Receipt #: TXN-${transactionId.slice(-6).toUpperCase()}`, 350, 65, { align: "right", width: 195 })
      .text(`Date: ${new Date(transaction.paymentDate).toLocaleDateString("en-BD")}`, 350, 80, { align: "right", width: 195 });

    // ===== প্রধান বডি =====
    doc.fillColor("#333");

    // সবুজ পেইড ব্যাজ
    doc.rect(50, 140, 495, 70).fill("#f0fdf4").stroke("#bbf7d0");
    doc
      .fillColor("#15803d")
      .font("Helvetica-Bold")
      .fontSize(32)
      .text(`BDT ${transaction.amount.toLocaleString()}`, 50, 155, { align: "center", width: 495 });
    doc
      .fillColor("#16a34a")
      .fontSize(11)
      .text("✓ PAYMENT SUCCESSFUL", 50, 195, { align: "center", width: 495 });

    // ভাড়াটিয়ার তথ্য
    doc.moveDown(3);
    const infoY = 240;
    doc.rect(50, infoY, 495, 180).fill("#f8f9fa").stroke("#e9ecef");

    doc
      .fillColor("#666")
      .font("Helvetica")
      .fontSize(10)
      .text("TENANT INFORMATION", 70, infoY + 16);

    const rows = [
      ["Tenant Name", tenant?.name || "—"],
      ["Phone", tenant?.phone || "—"],
      ["Property", invoice?.property?.name || "—"],
      ["Unit", invoice?.unit?.unitName || "—"],
      ["Month / Year", `${invoice?.month || "—"} ${invoice?.year || ""}`],
      ["Payment Method", transaction.paymentMethod],
      ...(transaction.transactionId ? [["Transaction ID", transaction.transactionId]] : []),
    ];

    rows.forEach((row, i) => {
      const y = infoY + 38 + i * 22;
      doc
        .fillColor("#555")
        .font("Helvetica")
        .fontSize(10)
        .text(row[0], 70, y);
      doc
        .fillColor("#111")
        .font("Helvetica-Bold")
        .text(row[1], 300, y);
    });

    // পেমেন্ট সামারি
    const summaryY = infoY + 200;
    doc.rect(50, summaryY, 495, 80).fill("#ede9fe").stroke("#c4b5fd");
    doc
      .fillColor("#5b21b6")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("PAYMENT SUMMARY", 70, summaryY + 14);
    doc
      .fillColor("#7c3aed")
      .font("Helvetica")
      .fontSize(10)
      .text("Amount Paid:", 70, summaryY + 34)
      .font("Helvetica-Bold")
      .text(`BDT ${transaction.amount.toLocaleString()}`, 300, summaryY + 34);
    doc
      .font("Helvetica")
      .text("Remaining Due:", 70, summaryY + 52)
      .font("Helvetica-Bold")
      .fillColor(invoice?.dueAmount > 0 ? "#dc2626" : "#15803d")
      .text(`BDT ${invoice?.dueAmount?.toLocaleString() || "0"}`, 300, summaryY + 52);

    // ফুটার
    doc
      .fillColor("#aaa")
      .font("Helvetica")
      .fontSize(9)
      .text(
        "This is a computer-generated receipt. No signature required.",
        50,
        720,
        { align: "center", width: 495 }
      );
    doc
      .text("Bariowla Property Management | © " + new Date().getFullYear(), 50, 734, {
        align: "center",
        width: 495,
      });

    doc.end();
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. পেমেন্ট রিসিট ইমেইল পাঠানো
export const sendReceiptByEmail = async (req: Req, res: Res) => {
  try {
    const transactionId = req.params.transactionId as string;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ট্রানজেকশন আইডি!" });
    }

    const transaction = await Transaction.findById(transactionId)
      .populate("tenant", "name phone email")
      .populate({ path: "invoice", populate: { path: "property unit", select: "name unitName" } });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "ট্রানজেকশন খুঁজে পাওয়া যায়নি!" });
    }

    const tenant = transaction.tenant as any;
    const invoice = transaction.invoice as any;

    if (!tenant?.email) {
      return res.status(400).json({ success: false, message: "ভাড়াটিয়ার ইমেইল ঠিকানা নেই!" });
    }

    await sendPaymentReceiptEmail({
      tenantEmail: tenant.email,
      tenantName: tenant.name,
      amount: transaction.amount,
      paymentMethod: transaction.paymentMethod,
      ...(transaction.transactionId ? { transactionId: transaction.transactionId } : {}),
      propertyName: invoice?.property?.name,
      unitName: invoice?.unit?.unitName,
      month: invoice?.month,
      year: invoice?.year,
      paidDate: transaction.paymentDate,
      remainingDue: invoice?.dueAmount ?? 0,
    });

    res.status(200).json({ success: true, message: "ইমেইল সফলভাবে পাঠানো হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. ভাড়া বাকির রিমাইন্ডার ইমেইল (বাল্ক)
export const sendRentReminders = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    // সব বকেয়া ইনভয়েস বের করা
    const pendingInvoices = await Invoice.find({
      owner: ownerObjectId,
      status: { $ne: "Paid" },
    })
      .populate("tenant", "name email")
      .populate("property", "name")
      .populate("unit", "unitName");

    let sentCount = 0;
    const errors: string[] = [];

    for (const inv of pendingInvoices) {
      const tenant = inv.tenant as any;
      if (!tenant?.email) continue;

      try {
        await sendRentReminderEmail({
          tenantEmail: tenant.email,
          tenantName: tenant.name,
          dueAmount: inv.dueAmount,
          propertyName: (inv.property as any)?.name || "—",
          unitName: (inv.unit as any)?.unitName || "—",
          month: inv.month,
          year: inv.year,
        });
        sentCount++;
      } catch (err: any) {
        errors.push(`${tenant.name}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `${sentCount}টি রিমাইন্ডার ইমেইল পাঠানো হয়েছে।`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. লিজ এক্সপায়ারি নোটিফিকেশন ইমেইল পাঠানো
export const sendLeaseExpiryNotifications = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);

    const expiringTenants = await Tenant.find({
      owner: ownerObjectId,
      status: "সক্রিয়",
      leaseEnd: { $gte: today, $lte: in30Days },
      email: { $ne: "" },
    })
      .populate("unit", "unitName")
      .populate("property", "name");

    let sentCount = 0;

    for (const tenant of expiringTenants) {
      const daysLeft = Math.ceil(
        (new Date(tenant.leaseEnd!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      await sendLeaseExpiryEmail({
        tenantEmail: (tenant as any).email,
        tenantName: tenant.name,
        propertyName: (tenant.property as any)?.name || "—",
        unitName: (tenant.unit as any)?.unitName || "—",
        leaseEnd: tenant.leaseEnd!,
        daysLeft,
      });
      sentCount++;
    }

    res.status(200).json({
      success: true,
      message: `${sentCount}জন ভাড়াটিয়াকে লিজ এক্সপায়ারি নোটিফিকেশন পাঠানো হয়েছে।`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
