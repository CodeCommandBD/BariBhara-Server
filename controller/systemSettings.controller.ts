import type { Request, Response } from "express";
import SystemSettings from "../models/systemSettings.model.js";

// ১. পাবলিকলি সিস্টেম সেটিংস (পেমেন্ট নম্বর) দেখা
export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSettings.findOne({ key: "main_config" });
    if (!settings) {
      settings = await SystemSettings.create({
        key: "main_config",
        bkashNumber: "০১৭XX-XXXXXX",
        nagadNumber: "০১৭XX-XXXXXX",
        rocketNumber: ""
      });
    }
    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ২. অ্যাডমিন প্যানেল থেকে সিস্টেম সেটিংস (পেমেন্ট নম্বর) আপডেট করা
export const updateSystemSettings = async (req: Request, res: Response) => {
  try {
    const { bkashNumber, nagadNumber, rocketNumber } = req.body;

    let settings = await SystemSettings.findOne({ key: "main_config" });
    if (!settings) {
      settings = new SystemSettings({ key: "main_config" });
    }

    if (bkashNumber !== undefined) settings.bkashNumber = bkashNumber;
    if (nagadNumber !== undefined) settings.nagadNumber = nagadNumber;
    if (rocketNumber !== undefined) settings.rocketNumber = rocketNumber;
    settings.updatedAt = new Date();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "পেমেন্ট নম্বরসমূহ সফলভাবে আপডেট করা হয়েছে!",
      settings
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
