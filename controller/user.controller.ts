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
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      });
  
      await newUser
        .save()
        .then(() => {
          return res.status(201).json({
            success: true,
            message: "User registered successfully!",
            user: {
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
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
        user: user.name,
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