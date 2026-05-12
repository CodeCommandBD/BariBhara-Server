import type { Request as Req, Response as Res } from "express";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";

// In-memory OTP store: { userId: { otp, expiresAt } }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ১. OTP পাঠাও
export const sendOTP = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user?.id as string;
    const { email } = req.body;

    const user = await User.findOne({ _id: ownerId, email });
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 মিনিট

    otpStore.set(ownerId, { otp, expiresAt });

    await transporter.sendMail({
      from: `"Bari Bhara" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Bari Bhara — আপনার OTP কোড",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 420px; margin: 0 auto;">
          <h2 style="color: #7c3aed; margin-bottom: 8px;">🏠 Bari Bhara</h2>
          <p style="color: #374151;">আপনার Two-Factor Authentication কোড:</p>
          <div style="background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 16px; padding: 24px; text-align: center; margin: 20px 0;">
            <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #7c3aed;">${otp}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">এই কোড <strong>৫ মিনিট</strong> পর্যন্ত বৈধ। কাউকে শেয়ার করবেন না।</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: "OTP পাঠানো হয়েছে" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. OTP যাচাই করো
export const verifyOTP = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user?.id as string;
    const { otp } = req.body;

    const stored = otpStore.get(ownerId);
    if (!stored) return res.status(400).json({ success: false, message: "OTP পাওয়া যায়নি বা মেয়াদ শেষ" });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(ownerId);
      return res.status(400).json({ success: false, message: "OTP-এর মেয়াদ শেষ হয়ে গেছে" });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: "OTP সঠিক নয়" });

    otpStore.delete(ownerId);
    res.status(200).json({ success: true, message: "OTP যাচাই সফল হয়েছে" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. 2FA Enable/Disable করো
export const toggle2FA = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user?.id as string;
    const { enabled } = req.body;

    const user = await User.findByIdAndUpdate(ownerId, { twoFactorEnabled: Boolean(enabled) }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি" });

    res.status(200).json({
      success: true,
      message: `2FA ${enabled ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে`,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Login-এর সময় OTP যাচাই (2FA login step)
export const verifyLoginOTP = async (req: Req, res: Res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ success: false, message: "userId এবং OTP প্রয়োজন" });

    const stored = otpStore.get(userId);
    if (!stored) return res.status(400).json({ success: false, message: "OTP পাওয়া যায়নি" });
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(userId);
      return res.status(400).json({ success: false, message: "OTP-এর মেয়াদ শেষ" });
    }
    if (stored.otp !== otp) return res.status(400).json({ success: false, message: "OTP সঠিক নয়" });

    otpStore.delete(userId);
    res.status(200).json({ success: true, message: "লগইন সফল হয়েছে" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. Login-এর সময় OTP পাঠাও (public — no auth needed yet)
export const sendLoginOTP = async (req: Req, res: Res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, twoFactorEnabled: true });
    if (!user) return res.status(404).json({ success: false, message: "2FA সক্রিয় নয়" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(user._id.toString(), { otp, expiresAt });

    await transporter.sendMail({
      from: `"Bari Bhara" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 লগইন OTP কোড — Bari Bhara",
      html: `<div style="font-family: Arial; padding: 24px; text-align: center;">
        <h2 style="color:#7c3aed;">🏠 Bari Bhara Login OTP</h2>
        <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:16px;padding:24px;margin:16px 0;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#7c3aed;">${otp}</span>
        </div>
        <p style="color:#6b7280;font-size:13px;">এই কোড ৫ মিনিট বৈধ।</p>
      </div>`,
    });

    res.status(200).json({ success: true, message: "OTP পাঠানো হয়েছে", userId: user._id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
