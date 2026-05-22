import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
const saltRounds = 10;
// OTP Store for Password Reset: { email: { otp, expiresAt } }
const resetOtpStore = new Map();
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password, phone, role } = req.body;
        // ১. চেক করা ইউজার আগে থেকে আছে কি না (Email বা Phone দিয়ে)
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? "এই ইমেইল দিয়ে ইতেমধ্যেই অ্যাকাউন্ট খোলা আছে!"
                    : "এই ফোন নম্বর দিয়ে ইতেমধ্যেই অ্যাকাউন্ট খোলা আছে!",
            });
        }
        // পাসওয়ার্ডের শক্তি চেক করা
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে এবং তাতে বড় হাত, ছোট হাতের অক্ষর ও সংখ্যা থাকতে হবে!",
            });
        }
        // ২. পাসওয়ার্ড হ্যাশ করা
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // রোল ভ্যালিডেশন (টাইপো ফিক্স করার জন্য)
        let userRole = "landlord";
        if (role === "tenant")
            userRole = "tenant";
        // ৩. নতুন ইউজার তৈরি
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            phone,
            role: userRole,
        });
        await newUser.save();
        // ৪. টোকেন জেনারেট করা (Auto-login এর জন্য)
        const token = jwt.sign({ id: newUser._id, user: newUser.fullName }, process.env.SECRET_KEY, { expiresIn: "48h" });
        return res.status(201).json({
            success: true,
            message: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!",
            token: "Bearer " + token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({
            success: false,
            message: "দুঃখিত, সার্ভারে একটি সমস্যা হয়েছে! " + (error.message || "আবার চেষ্টা করুন।"),
        });
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি!",
            });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "ভুল পাসওয়ার্ড দিয়েছেন! আবার চেষ্টা করুন।",
            });
        }
        // 2FA চেক করা (যদি ডিভাইসটি ট্রাস্টেড না থাকে)
        const isDeviceTrusted = deviceId && user.trustedDevices?.includes(deviceId);
        console.log(`Login check: deviceId=${deviceId}, isTrusted=${isDeviceTrusted}`);
        if (user.twoFactorEnabled && !isDeviceTrusted) {
            return res.status(200).json({
                success: true,
                message: "লগইনের জন্য 2FA ভেরিফিকেশন প্রয়োজন।",
                requires2FA: true,
                userId: user._id,
                email: user.email,
            });
        }
        const token = jwt.sign({ id: user._id, user: user.fullName }, process.env.SECRET_KEY, { expiresIn: "48h" });
        return res.status(200).json({
            success: true,
            message: "লগইন সফল হয়েছে! স্বাগতম।",
            token: "Bearer " + token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                twoFactorEnabled: user.twoFactorEnabled
            },
        });
    }
    catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "লগইন করতে সমস্যা হচ্ছে, দয়া করে আবার চেষ্টা করুন।",
        });
    }
};
// ৫. Forgot Password — OTP পাঠানো
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "এই ইমেইল দিয়ে কোনো ইউজার পাওয়া যায়নি!" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // ১০ মিনিট
        resetOtpStore.set(email, { otp, expiresAt });
        await transporter.sendMail({
            from: `"Bari Bhara Security" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔑 পাসওয়ার্ড রিসেট ওটিপি কোড",
            html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; text-align: center; border: 1px solid #eee; border-radius: 12px; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">পাসওয়ার্ড রিসেট</h2>
          <p>আপনার অ্যাকাউন্ট পাসওয়ার্ড রিসেট করার জন্য নিচের ওটিপি কোডটি ব্যবহার করুন:</p>
          <div style="background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 12px; padding: 16px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #7c3aed;">${otp}</span>
          </div>
          <p style="color: #666; font-size: 12px;">এই কোডটি ১০ মিনিট পর্যন্ত বৈধ থাকবে। আপনি যদি পাসওয়ার্ড রিসেট করতে না চান, তবে এই মেইলটি ইগনোর করুন।</p>
        </div>
      `,
        });
        res.status(200).json({ success: true, message: "আপনার ইমেইলে ওটিপি পাঠানো হয়েছে।" });
    }
    catch (error) {
        console.error("Forgot PW Error:", error);
        res.status(500).json({ success: false, message: "ওটিপি পাঠাতে সমস্যা হয়েছে।" });
    }
};
// ৬. Verify Reset OTP
const verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const stored = resetOtpStore.get(email);
        if (!stored || Date.now() > stored.expiresAt) {
            return res.status(400).json({ success: false, message: "ওটিপি পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে!" });
        }
        if (stored.otp !== otp) {
            return res.status(400).json({ success: false, message: "ভুল ওটিপি কোড দিয়েছেন!" });
        }
        res.status(200).json({ success: true, message: "ওটিপি ভেরিফিকেশন সফল হয়েছে।" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "সার্ভারে সমস্যা হয়েছে।" });
    }
};
// ৭. Reset Password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const stored = resetOtpStore.get(email);
        if (!stored || stored.otp !== otp) {
            return res.status(400).json({ success: false, message: "অননুমোদিত রিকোয়েস্ট!" });
        }
        // পাসওয়ার্ডের শক্তি চেক করা
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে এবং তাতে বড় হাত, ছোট হাতের অক্ষর ও সংখ্যা থাকতে হবে!",
            });
        }
        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ success: false, message: "ইউজার পাওয়া যায়নি।" });
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        // সরাসরি আপডেট করা ভালো যাতে অন্যান্য ভ্যালিডেশনে সমস্যা না হয়
        await User.findByIdAndUpdate(user._id, { password: hashedPassword });
        resetOtpStore.delete(email);
        res.status(200).json({ success: true, message: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!" });
    }
    catch (error) {
        console.error("Reset PW Error Detail:", error);
        res.status(500).json({ success: false, message: "পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। " + (error.message || "") });
    }
};
export { registerUser, loginUser, forgotPassword, verifyResetOTP, resetPassword };
//# sourceMappingURL=user.controller.js.map