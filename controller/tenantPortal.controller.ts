import type { Request as Req, Response as Res } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Tenant from "../models/tenant.model.js";
import Invoice from "../models/invoice.model.js";
import Maintenance from "../models/maintenance.model.js";
import TenantNotification from "../models/tenantNotification.model.js";
import { generateInvoicePDF, generateInvoiceNumber } from "../services/pdf.service.js";
import { sendNotification, sendTenantNotification } from "../services/socket.service.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});


const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES = "7d";

// ============================================================
// ১. Tenant Login (phone বা email দিয়ে)
// ============================================================
export const tenantLogin = async (req: Req, res: Res) => {
  try {
    const { identifier, password } = req.body; // identifier = phone বা email

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "ফোন/ইমেইল এবং পাসওয়ার্ড দিন!" });
    }

    // phone বা email দিয়ে খোঁজা
    const tenant = await Tenant.findOne({
      $or: [{ phone: identifier }, { email: identifier }],
      portalEnabled: true,
    }).select("+portalPassword");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি বা পোর্টাল এনাবল নেই!" });
    }

    const isMatch = await (tenant as any).comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "পাসওয়ার্ড ভুল!" });
    }

    const token = jwt.sign(
      { id: tenant._id, role: "tenant" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      success: true,
      message: "লগইন সফল!",
      token: `Bearer ${token}`,
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email,
        photo: tenant.photo,
        property: tenant.property,
        unit: tenant.unit,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ২. Tenant Dashboard — নিজের সব তথ্য
// ============================================================
export const getTenantDashboard = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;

    const tenant = await Tenant.findById(tenantId)
      .populate("property", "name address")
      .populate("unit", "unitName floor type");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    // সর্বশেষ ৩টি invoice
    const recentInvoices = await Invoice.find({ tenant: tenantId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("month year totalAmount paidAmount dueAmount status");

    // বকেয়া হিসাব
    const allInvoices = await Invoice.find({ tenant: tenantId });
    const totalDue = allInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
    const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

    // চলমান maintenance requests
    const activeMaintenance = await Maintenance.find({
      tenant: tenantId,
      status: { $in: ["Pending", "In Progress"] },
    }).select("title status priority createdAt");

    res.json({
      success: true,
      tenant,
      stats: {
        totalDue,
        totalPaid,
        totalInvoices: allInvoices.length,
        activeMaintenance: activeMaintenance.length,
      },
      recentInvoices,
      activeMaintenance,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৩. Tenant-এর সব Invoice দেখা
// ============================================================
export const getTenantInvoices = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { status, year } = req.query;

    const filter: any = { tenant: tenantId };
    if (status) filter.status = status;
    if (year) filter.year = Number(year);

    const invoices = await Invoice.find(filter)
      .sort({ year: -1, createdAt: -1 })
      .populate("property", "name")
      .populate("unit", "unitName");

    res.json({ success: true, invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৪. Tenant Invoice PDF Download
// ============================================================
export const downloadTenantInvoicePDF = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { invoiceId } = req.params;

    const invoice = await Invoice.findOne({ _id: invoiceId, tenant: tenantId })
      .populate("tenant", "name phone")
      .populate("property", "name")
      .populate("unit", "unitName");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "ইনভয়েস পাওয়া যায়নি!" });
    }

    const tenant = invoice.tenant as any;
    const property = invoice.property as any;
    const unit = invoice.unit as any;
    const invoiceNumber = generateInvoiceNumber(String(invoice._id));

    const pdfBuffer = await generateInvoicePDF({
      invoiceNumber,
      tenantName: tenant?.name ?? "N/A",
      tenantPhone: tenant?.phone ?? "N/A",
      propertyName: property?.name ?? "N/A",
      unitName: unit?.unitName ?? "N/A",
      month: invoice.month,
      year: invoice.year,
      paymentDate: new Date(),
      paymentMethod: "—",
      baseRent: invoice.baseRent ?? 0,
      waterBill: invoice.waterBill ?? 0,
      gasBill: invoice.gasBill ?? 0,
      electricityBill: invoice.electricityBill ?? 0,
      serviceCharge: invoice.serviceCharge ?? 0,
      otherBill: invoice.otherBill ?? 0,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: Math.max(0, invoice.dueAmount),
      ownerName: "মালিক",
      status: invoice.status as "Paid" | "Partial" | "Unpaid",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৫. Maintenance Request করা (Tenant-এর পক্ষ থেকে)
// ============================================================
export const tenantCreateMaintenance = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { title, description, priority } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
    }

    const maintenance = await (Maintenance as any).create({
      title,
      description,
      priority: priority || "Medium",
      status: "Pending",
      property: tenant.property,
      unit: tenant.unit,
      tenant: tenantId,
      owner: tenant.owner,
    });

    // বাড়িওয়ালাকে নোটিফিকেশন পাঠানো
    await sendNotification({
      recipient: String(tenant.owner),
      type: "maintenance",
      title: "নতুন মেইনটেন্যান্স রিকোয়েস্ট! 🛠️",
      message: `${tenant.name} থেকে একটি নতুন অনুরোধ এসেছে: "${title}"`,
      link: "/maintenance",
    });

    res.status(201).json({ success: true, message: "অনুরোধ পাঠানো হয়েছে!", maintenance });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৬. Tenant-এর Maintenance Requests দেখা
// ============================================================
export const getTenantMaintenance = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
    }

    const requests = await Maintenance.find({
      unit: tenant.unit,
      owner: tenant.owner,
    })
      .sort({ createdAt: -1 })
      .populate("property", "name")
      .populate("unit", "unitName");

    res.json({ success: true, requests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৭. Tenant Portal Enable/Disable করা (Landlord)
// ============================================================
export const setTenantPortalAccess = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { tenantId } = req.params;
    const { enabled, password } = req.body;

    const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId });
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
    }

    tenant.portalEnabled = Boolean(enabled);
    if (password) {
      (tenant as any).portalPassword = password; // pre-save hook hash করবে
    }

    await tenant.save();

    res.json({
      success: true,
      message: enabled ? "পোর্টাল এনাবল করা হয়েছে!" : "পোর্টাল ডিসেবল করা হয়েছে!",
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ৮. Tenant Notifications — সব নোটিফিকেশন আনা
// ============================================================
export const getTenantNotifications = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const notifications = await TenantNotification.find({ recipient: tenantId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await TenantNotification.countDocuments({ recipient: tenantId, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ৯. একটি নোটিফিকেশন পড়া হয়েছে
export const markTenantNotificationRead = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি" });
    }
    await TenantNotification.findOneAndUpdate({ _id: id, recipient: tenantId }, { isRead: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ১০. সব নোটিফিকেশন পড়া হয়েছে
export const markAllTenantNotificationsRead = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    await TenantNotification.updateMany({ recipient: tenantId, isRead: false }, { isRead: true });
    res.json({ success: true, message: "সব নোটিফিকেশন পড়া হয়েছে।" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// ১১. Tenant Profile — নিজের তথ্য দেখা
// ============================================================
export const getTenantProfile = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    console.log("[Diagnostic] getTenantProfile requested for tenantId:", tenantId);
    const tenant = await Tenant.findById(tenantId)
      .populate("property", "name address")
      .populate("unit", "unitName floor type");
    if (!tenant) {
      console.log("[Diagnostic] Tenant not found for tenantId:", tenantId);
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
    }
    console.log("[Diagnostic] Loaded Tenant Name:", tenant.name);
    console.log("[Diagnostic] Loaded Tenant Agreement:", JSON.stringify(tenant.agreement, null, 2));
    res.json({ success: true, tenant });
  } catch (err: any) {
    console.error("[Diagnostic] Error in getTenantProfile:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ১২. Tenant Profile — নিজের তথ্য আপডেট করা (name, email, photo)
export const updateTenantProfile = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { name, email, photoBase64 } = req.body;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    if (name) tenant.name = name;
    if (email) tenant.email = email;

    // Cloudinary photo upload
    if (photoBase64) {
      const uploadRes = await cloudinary.uploader.upload(photoBase64, {
        folder: "tenant-photos",
        transformation: [{ width: 400, height: 400, crop: "fill" }],
      });
      tenant.photo = uploadRes.secure_url;
    }

    await tenant.save();
    res.json({ success: true, message: "প্রোফাইল আপডেট হয়েছে!", tenant });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ১৩. Tenant Profile — NID স্ক্যান আপলোড
export const uploadTenantNID = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { nidBase64 } = req.body;

    if (!nidBase64) {
      return res.status(400).json({ success: false, message: "ফাইল প্রদান করা হয়নি!" });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    // Cloudinary NID upload
    const uploadRes = await cloudinary.uploader.upload(nidBase64, {
      folder: "tenant-documents/nid",
    });

    // Save to documents array
    tenant.documents.push({
      type: "nid",
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id,
      uploadedAt: new Date(),
    });

    // Update nidVerification status
    tenant.nidVerification = {
      status: "pending",
      submittedAt: new Date(),
      verifiedAt: undefined as any,
      rejectionReason: undefined as any,
    };

    // Notify landlord
    if (tenant.owner) {
      await sendNotification({
        recipient: String(tenant.owner),
        type: "system",
        title: "নতুন NID আপলোড! 🆔",
        message: `${tenant.name} নতুন NID স্ক্যান আপলোড করেছেন। অনুগ্রহ করে রিভিউ করুন।`,
        link: "/tenants",
      });
    }

    await tenant.save();
    res.json({ success: true, message: "NID সফলভাবে আপলোড হয়েছে! রিভিউয়ের জন্য অপেক্ষমাণ।", tenant });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ১৩. Tenant Portal Password Change
export const changePortalPassword = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "সব ফিল্ড পূরণ করুন!" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!" });
    }

    const tenant = await Tenant.findById(tenantId).select("+portalPassword");
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    const isMatch = await (tenant as any).comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "বর্তমান পাসওয়ার্ড ভুল!" });
    }

    (tenant as any).portalPassword = newPassword; // pre-save hook hash করবে
    await tenant.save();
    res.json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

