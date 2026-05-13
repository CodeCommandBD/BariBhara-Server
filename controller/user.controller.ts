import type { Request as Req, Response as Res } from "express";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const saltRounds = 10;

const registerUser = async (req: Req, res: Res) => {
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

    // ২. পাসওয়ার্ড হ্যাশ করা
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ৩. নতুন ইউজার তৈরি
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phone,
      role: role || "landlord",
    });

    await newUser.save();

    // ৪. টোকেন জেনারেট করা (Auto-login এর জন্য)
    const token = jwt.sign(
      { id: newUser._id, user: newUser.fullName },
      process.env.SECRET_KEY as string,
      { expiresIn: "48h" }
    );

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

  } catch (error: any) {
    console.error("Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "দুঃখিত, সার্ভারে একটি সমস্যা হয়েছে! " + (error.message || "আবার চেষ্টা করুন।"),
    });
  }
};

const loginUser = async (req: Req, res: Res) => {
  try {
    const { email, password } = req.body;

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

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        message: "লগইনের জন্য 2FA ভেরিফিকেশন প্রয়োজন।",
        requires2FA: true,
        userId: user._id,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { id: user._id, user: user.fullName },
      process.env.SECRET_KEY as string,
      { expiresIn: "48h" }
    );

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
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "লগইন করতে সমস্যা হচ্ছে, দয়া করে আবার চেষ্টা করুন।",
    });
  }
};

export { registerUser, loginUser };