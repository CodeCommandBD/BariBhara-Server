import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Unit from "../models/unit.model.js";
import Property from "../models/property.model.js";

// ১. নতুন ভাড়াটিয়া যোগ করা (Assign Tenant to a Unit)
export const addTenant = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;
    const files = req.files as Express.Multer.File[] | undefined;
    const photoUrl = files?.[0]?.path?.replace(/\\/g, "/") ?? "";

    const { unit, property, name, phone, nid, rentAmount, advanceAmount, leaseStart, leaseEnd } =
      req.body as {
        unit: string;
        property: string;
        name: string;
        phone: string;
        nid?: string;
        rentAmount: number;
        advanceAmount?: number;
        leaseStart: string;
        leaseEnd?: string;
      };

    // ক. ইউনিটটি আছে কি না চেক করা
    const targetUnit = await Unit.findById(unit);
    if (!targetUnit) {
      return res.status(404).json({ success: false, message: "ইউনিটটি খুঁজে পাওয়া যায়নি!" });
    }

    // খ. ইউনিটটি কি ইতোমধ্যে ভাড়া দেওয়া হয়েছে?
    if ((targetUnit.status as string) === "ভাড়া হয়েছে") {
      return res.status(400).json({ success: false, message: "এই ইউনিটে ইতোমধ্যে একজন ভাড়াটিয়া আছেন!" });
    }

    // গ. প্রপার্টির মালিক যাচাই করা
    const targetProperty = await Property.findById(property);
    if (!targetProperty) {
      return res.status(404).json({ success: false, message: "প্রপার্টি খুঁজে পাওয়া যায়নি!" });
    }
    if (String(targetProperty.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই প্রপার্টির মালিক নন!" });
    }

    // ঘ. নতুন ভাড়াটিয়া তৈরি করা
    const newTenant = new Tenant({
      unit: new mongoose.Types.ObjectId(unit),
      property: new mongoose.Types.ObjectId(property),
      owner: new mongoose.Types.ObjectId(ownerId),
      name,
      phone,
      nid: nid || "",
      photo: photoUrl,
      rentAmount: Number(rentAmount),
      advanceAmount: Number(advanceAmount) || 0,
      leaseStart: new Date(leaseStart),
      leaseEnd: leaseEnd ? new Date(leaseEnd) : undefined,
    });
    await newTenant.save();

    // ঙ. ইউনিটের স্ট্যাটাস "ভাড়া হয়েছে" করে দেওয়া এবং ভাড়াটিয়ার রেফারেন্স যোগ করা
    await Unit.findByIdAndUpdate(unit, {
      status: "ভাড়া হয়েছে",
      currentTenant: newTenant._id,
    });

    res.status(201).json({
      success: true,
      message: `${name} সফলভাবে ভাড়াটিয়া হিসেবে যোগ করা হয়েছে!`,
      tenant: newTenant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. একজন মালিকের সকল ভাড়াটিয়ার তালিকা
export const getAllTenants = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;

    const tenants = await Tenant.find({
      owner: new mongoose.Types.ObjectId(ownerId),
      status: "সক্রিয়",
    })
      .populate("unit", "unitName floor type rent")
      .populate("property", "name location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tenants.length,
      tenants,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. একটি নির্দিষ্ট ইউনিটের বর্তমান ভাড়াটিয়া
export const getTenantByUnit = async (req: Req, res: Res) => {
  try {
    const unitId = req.params.unitId as string; // Express params সবসময় string হয়

    if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইউনিট আইডি!" });
    }

    const tenant = await Tenant.findOne({
      unit: new mongoose.Types.ObjectId(unitId),
      status: "সক্রিয়",
    })
      .populate("unit", "unitName floor type rent")
      .populate("property", "name location");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "এই ইউনিটে কোনো সক্রিয় ভাড়াটিয়া নেই!" });
    }

    res.status(200).json({ success: true, tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. ভাড়াটিয়ার তথ্য আপডেট করা
export const updateTenant = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string; // Express params সবসময় string হয়
    const ownerId = (req as any).user.id as string;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই ভাড়াটিয়ার তথ্য পরিবর্তন করার অনুমতিপ্রাপ্ত নন!" });
    }

    const updateData: Record<string, any> = { ...req.body };

    // নতুন ছবি আপলোড হলে সেটি আপডেট করা
    if (files && files.length > 0) {
      updateData.photo = files?.[0]?.path?.replace(/\\/g, "/") ?? "";
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "ভাড়াটিয়ার তথ্য সফলভাবে আপডেট করা হয়েছে!",
      tenant: updatedTenant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. ভাড়াটিয়া সরানো (Vacate) — ইউনিট খালি হয়ে যাবে
export const vacateTenant = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string; // Express params সবসময় string হয়
    const ownerId = (req as any).user.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই অপারেশনের অনুমতি নেই!" });
    }

    // ক. ভাড়াটিয়ার স্ট্যাটাস "চলে গেছে" করা
    await Tenant.findByIdAndUpdate(id, { status: "চলে গেছে" });

    // খ. ইউনিটের স্ট্যাটাস "খালি" করা এবং ভাড়াটিয়ার রেফারেন্স মুছে দেওয়া
    await Unit.findByIdAndUpdate(tenant.unit, {
      status: "খালি",
      $unset: { currentTenant: 1 },
    });

    res.status(200).json({
      success: true,
      message: `${tenant.name} ইউনিট ছেড়ে গেছেন। ইউনিটটি এখন খালি।`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
