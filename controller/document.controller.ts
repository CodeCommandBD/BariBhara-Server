import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import cloudinary from "cloudinary";
import PDFDocument from "pdfkit";

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ১. ডকুমেন্ট আপলোড (NID, চুক্তিপত্র ইত্যাদি)
export const uploadDocument = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { tenantId } = req.params;
    const { docType } = req.body; // "nid" | "photo" | "contract" | "other"
    const file = (req as any).file;

    if (!file) return res.status(400).json({ success: false, message: "ফাইল প্রয়োজন" });

    const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId });
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });

    // Cloudinary-তে আপলোড
    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.v2.uploader.upload_stream(
        { folder: `bari-bhara/documents/${ownerId}/${tenantId}`, resource_type: "auto" },
        (error, result) => { if (error) reject(error); else resolve(result); }
      );
      stream.end(file.buffer);
    });

    // Tenant-এ ডকুমেন্ট সংযুক্ত করো
    const doc = { type: docType || "other", url: result.secure_url, publicId: result.public_id, uploadedAt: new Date() };
    (tenant as any).documents = (tenant as any).documents ?? [];
    (tenant as any).documents.push(doc);
    await tenant.save();

    res.status(200).json({ success: true, message: "ডকুমেন্ট আপলোড হয়েছে", document: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. ভাড়াটিয়ার সকল ডকুমেন্টের তালিকা
export const getDocuments = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId }).select("name documents");
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });

    res.status(200).json({ success: true, documents: (tenant as any).documents ?? [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. ডকুমেন্ট ডিলিট
export const deleteDocument = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { tenantId, publicId } = req.params;
    const decodedPublicId = decodeURIComponent(publicId as string);

    const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId });
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });

    await cloudinary.v2.uploader.destroy(decodedPublicId);
    (tenant as any).documents = ((tenant as any).documents ?? []).filter(
      (d: any) => d.publicId !== decodedPublicId
    );
    await tenant.save();

    res.status(200).json({ success: true, message: "ডকুমেন্ট মুছে ফেলা হয়েছে" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Lease Agreement PDF জেনারেট
export const generateLeasePDF = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const { tenantId } = req.params;

    const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId })
      .populate("property", "name address")
      .populate("unit", "unitName floorNumber")
      .populate("owner", "fullName email phone");

    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="lease-${tenant.name.replace(/\s/g, "_")}.pdf"`);
    doc.pipe(res);

    const property = (tenant as any).property;
    const unit = (tenant as any).unit;
    const owner = (tenant as any).owner;

    // ——— PDF Content (Premium Design) ———
    
    // 1. Header Section
    doc.rect(0, 0, 595, 120).fill("#7c3aed"); // Violet Header
    doc.fillColor("#ffffff");
    doc.fontSize(28).font("Helvetica-Bold").text("Bari Bhara", 50, 40);
    doc.fontSize(12).font("Helvetica").text("SMART RENTAL AGREEMENT", 50, 75);
    
    doc.fontSize(10).text("Date:", 420, 45, { continued: true }).font("Helvetica-Bold").text(` ${new Date().toLocaleDateString("en-BD")}`);
    doc.font("Helvetica").text("Agreement ID:", 420, 60, { continued: true }).font("Helvetica-Bold").text(` BB-${tenant._id.toString().slice(-6).toUpperCase()}`);
    
    doc.moveDown(5);
    doc.fillColor("#1e293b"); // Slate-800 for body text
    
    // 2. Parties Section (Two Columns)
    const topY = 150;
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#7c3aed").text("PARTIES", 50, topY);
    doc.moveTo(50, topY + 18).lineTo(545, topY + 18).strokeColor("#e2e8f0").lineWidth(1).stroke();
    
    // Landlord Column
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#64748b").text("LANDLORD (Owner)", 50, topY + 30);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(owner?.fullName ?? "—");
    doc.fontSize(10).font("Helvetica").fillColor("#475569").text(`Phone: ${owner?.phone ?? "—"}`);
    doc.text(`Email: ${owner?.email ?? "—"}`);

    // Tenant Column
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#64748b").text("TENANT (Renter)", 300, topY + 30);
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(tenant.name);
    doc.fontSize(10).font("Helvetica").fillColor("#475569").text(`Phone: ${tenant.phone}`);
    doc.text(`NID: ${(tenant as any).nid ?? "—"}`);

    // 3. Property Details Section
    const propY = 250;
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#7c3aed").text("PROPERTY DETAILS", 50, propY);
    doc.moveTo(50, propY + 18).lineTo(545, propY + 18).stroke();
    
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#1e293b").text(property?.name ?? "—", 50, propY + 30);
    doc.fontSize(10).font("Helvetica").fillColor("#475569").text(`Address: ${property?.address ?? "—"}`);
    doc.text(`Unit Name: ${unit?.unitName ?? "—"}  |  Floor: ${unit?.floorNumber ?? "—"}`);

    // 4. Lease Terms (Box Design)
    const termsY = 330;
    doc.fontSize(14).font("Helvetica-Bold").fillColor("#7c3aed").text("LEASE TERMS", 50, termsY);
    doc.moveTo(50, termsY + 18).lineTo(545, termsY + 18).stroke();

    doc.rect(50, termsY + 30, 495, 100).fill("#f8fafc"); // Light background box
    doc.fillColor("#1e293b");
    
    const gridY = termsY + 45;
    doc.fontSize(10).font("Helvetica").text("Monthly Rent", 70, gridY);
    doc.fontSize(11).font("Helvetica-Bold").text(`BDT ${(tenant.rentAmount ?? 0).toLocaleString()}/-`, 70, gridY + 15);
    
    doc.fontSize(10).font("Helvetica").text("Security Deposit", 220, gridY);
    doc.fontSize(11).font("Helvetica-Bold").text(`BDT ${((tenant as any).advanceAmount ?? 0).toLocaleString()}/-`, 220, gridY + 15);
    
    doc.fontSize(10).font("Helvetica").text("Lease Duration", 380, gridY);
    const start = tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString("en-BD") : "—";
    const end = (tenant as any).leaseEnd ? new Date((tenant as any).leaseEnd).toLocaleDateString("en-BD") : "—";
    doc.fontSize(10).font("Helvetica-Bold").text(`${start} to ${end}`, 380, gridY + 15);

    doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("* Rent is payable by the 5th of each month.", 70, gridY + 50);
    doc.text(`* Auto Renewal: ${(tenant as any).autoRenew ? "Enabled" : "Disabled"}`, 70, gridY + 65);

    // 5. Signatures
    const sigY = 550;
    doc.moveTo(50, sigY).lineTo(545, sigY).lineWidth(0.5).strokeColor("#cbd5e1").stroke();
    doc.moveDown(3);
    
    doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold");
    doc.text("__________________________", 50, sigY + 60);
    doc.text("Landlord Signature", 50, sigY + 75);
    
    doc.text("__________________________", 350, sigY + 60);
    doc.text("Tenant Signature", 350, sigY + 75);

    // Footer
    doc.fontSize(8).fillColor("#94a3b8").text("This is a computer-generated document and is legally binding as per the terms mentioned.", 50, 780, { align: "center" });
    doc.text("Bari Bhara — The Complete Rental Management Solution", 50, 792, { align: "center" });

    doc.end();
  } catch (error: any) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};
