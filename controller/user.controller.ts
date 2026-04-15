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
          message: "User already exists!",
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
            message: "User registered successfully!",
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
            message: "Something went wrong!",
          });
        });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong!",
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
        message: "User not found!",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid password!",
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
      message: "User logged in successfully!",
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
      message: "Something went wrong!",
    });
  }
}

export {registerUser, loginUser};