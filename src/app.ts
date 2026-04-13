import express, { type Application } from "express";
import "dotenv/config";
import "../config/database.js";
import cors from "cors";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import "../config/passport.js";

const app: Application = express();
const saltRounds = 10;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

// home route

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// register route
app.post("/register", async (req, res) => {
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
});

// login route
app.post("/login", async (req, res) => {
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
});

// protected route
app.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Profile route reached!",
      user: req.user,
    });
  },
);

// resourse not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Resourse not found!",
  });
});

// global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.log(err);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

export default app;
