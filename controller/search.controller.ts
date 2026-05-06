import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Property from "../models/property.model.js";
import Invoice from "../models/invoice.model.js";

// গ্লোবাল সার্চ — টেনেন্ট, প্রপার্টি, ইনভয়েস
export const globalSearch = async (req: Req, res: Res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId((req as any).user.id);
    const q = (req.query.q as string)?.trim();

    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, results: { tenants: [], properties: [], invoices: [] } });
    }

    const regex = new RegExp(q, "i");

    // সমান্তরালভাবে সব সার্চ করা
    const [tenants, properties, invoices] = await Promise.all([
      Tenant.find({
        owner: ownerId,
        $or: [{ name: regex }, { phone: regex }, { email: regex }],
      }).select("name phone email").limit(5),

      Property.find({
        owner: ownerId,
        $or: [{ name: regex }, { address: regex }],
      }).select("name address").limit(5),

      Invoice.find({
        owner: ownerId,
        $or: [{ status: regex }],
      })
        .populate("tenant", "name")
        .populate("property", "name")
        .select("status totalAmount dueDate")
        .limit(5),
    ]);

    res.status(200).json({
      success: true,
      results: { tenants, properties, invoices },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
