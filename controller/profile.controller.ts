import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import "dotenv/config";

// ক্লাউডিনারি কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

// ১. প্রোফাইল দেখা
export const getProfile = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি!" });
    res.status(200).json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. প্রোফাইল আপডেট (নাম, ফোন, বায়ো)
export const updateProfile = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    const { fullName, phone, bio } = req.body;

    const updated = await User.findByIdAndUpdate(
      userId,
      { fullName, phone, bio },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "প্রোফাইল আপডেট হয়েছে!",
      user: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. প্রোফাইল ছবি আপডেট (Cloudinary)
export const updateProfilePhoto = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "ছবি আপলোড করুন!" });
    }

    // Cloudinary তে আপলোড
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "bariowla/profiles",
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "face",
    });

    // লোকাল ফাইল মুছে ফেলা
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    const updated = await User.findByIdAndUpdate(
      userId,
      { photo: result.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "প্রোফাইল ছবি আপডেট হয়েছে!",
      user: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. পাসওয়ার্ড পরিবর্তন
export const changePassword = async (req: Req, res: Res) => {
  try {
    const userId = (req as any).user.id as string;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "বর্তমান ও নতুন পাসওয়ার্ড দিন!" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি!" });

    // বর্তমান পাসওয়ার্ড যাচাই
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "বর্তমান পাসওয়ার্ড সঠিক নয়!" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে!" });
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে সেভ
    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashed });

    res.status(200).json({ success: true, message: "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
