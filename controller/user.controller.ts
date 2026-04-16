import type { Request as Req, Response as Res } from "express";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const saltRounds = 10;


const registerUser = async (req: Req, res: Res) => {
    try {
      const user = await User.findOne({
        email: req.body.email,
      });
  
      if (user) {
        return res.status(400).json({
          success: false,
          message: "এই ইমেইল দিয়ে ইতেমধ্যেই অ্যাকাউন্ট খোলা আছে!",
        });
      }
  
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
  
      const newUser = new User({
        fullName: req.body.fullName,
        email: req.body.email,
        password: hashedPassword,
        phone: req.body.phone,
        role: req.body.role,
      });
  
      await newUser
        .save()
        .then(() => {
          // Generate token for auto-login after registration
          const token = jwt.sign(
            { id: newUser._id, user: newUser.fullName },
            process.env.SECRET_KEY as string,
            { expiresIn: "48h" }
          );

          return res.status(201).json({
            success: true,
            message: "আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!",
            token: "Bearer " + token, // Send token for auto-login
            user: {
              id: newUser._id,
              fullName: newUser.fullName,
              email: newUser.email,
              phone: newUser.phone,
              role: newUser.role,
            },
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            success: false,
            message: "দুঃখিত, কোনো একটি সমস্যা হয়েছে! আবার চেষ্টা করুন।",
          });
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "দুঃখিত, কোনো একটি সমস্যা হয়েছে! আবার চেষ্টা করুন।",
      });
    }
};

const loginUser = async (req: Req, res: Res) =>{
     try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি!",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "ভুল পাসওয়ার্ড দিয়েছেন! আবার চেষ্টা করুন।",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        user: user.fullName,
      },
      process.env.SECRET_KEY as string,
      {
        expiresIn: "1h",
      },
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
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "লগইন করতে সমস্যা হচ্ছে, দয়া করে আবার চেষ্টা করুন।",
    });
  }
}

export {registerUser, loginUser};