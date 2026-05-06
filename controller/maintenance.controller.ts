import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Maintenance from "../models/maintenance.model.js";

// ১. সব মেইনটেন্যান্স রিকোয়েস্ট লিস্ট
export const getAllMaintenance = async (req: Req, res: Res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId((req as any).user.id);
    const { status, priority, propertyId } = req.query;

    const filter: any = { owner: ownerId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (propertyId && mongoose.Types.ObjectId.isValid(propertyId as string)) {
      filter.property = new mongoose.Types.ObjectId(propertyId as string);
    }

    const items = await Maintenance.find(filter)
      .populate("property", "name address")
      .populate("unit", "unitNumber")
      .sort({ createdAt: -1 });

    // স্ট্যাটাস অনুযায়ী সামারি
    const summary = {
      total: items.length,
      pending: items.filter((i) => i.status === "Pending").length,
      inProgress: items.filter((i) => i.status === "In Progress").length,
      resolved: items.filter((i) => i.status === "Resolved").length,
      totalCost: items.reduce((sum, i) => sum + (i.cost || 0), 0),
    };

    res.status(200).json({ success: true, items, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. নতুন মেইনটেন্যান্স রিকোয়েস্ট তৈরি
export const createMaintenance = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { title, description, property, unit, priority, cost, reportedDate } = req.body;

    if (!title || !property) {
      return res.status(400).json({ success: false, message: "শিরোনাম ও প্রপার্টি আবশ্যক!" });
    }

    const item = await Maintenance.create({
      title,
      description,
      property,
      unit: unit || undefined,
      priority: priority || "Medium",
      cost: cost || 0,
      reportedDate: reportedDate ? new Date(reportedDate) : new Date(),
      owner: ownerId,
    });

    const populated = await item.populate("property", "name address");

    res.status(201).json({
      success: true,
      message: "মেইনটেন্যান্স রিকোয়েস্ট তৈরি হয়েছে!",
      item: populated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. স্ট্যাটাস আপডেট
export const updateMaintenanceStatus = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { id } = req.params;
    const { status, cost } = req.body;

    const item = await Maintenance.findOne({ _id: id as string, owner: ownerId });
    if (!item) return res.status(404).json({ success: false, message: "রিকোয়েস্ট পাওয়া যায়নি!" });

    item.status = status;
    if (cost !== undefined) item.cost = cost;
    if (status === "Resolved") item.resolvedDate = new Date();
    await item.save();

    res.status(200).json({ success: true, message: "স্ট্যাটাস আপডেট হয়েছে!", item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. মেইনটেন্যান্স রিকোয়েস্ট ডিলিট
export const deleteMaintenance = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { id } = req.params;

    const deleted = await Maintenance.findOneAndDelete({ _id: id as string, owner: ownerId });
    if (!deleted) return res.status(404).json({ success: false, message: "রিকোয়েস্ট পাওয়া যায়নি!" });

    res.status(200).json({ success: true, message: "মেইনটেন্যান্স রিকোয়েস্ট ডিলিট হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
