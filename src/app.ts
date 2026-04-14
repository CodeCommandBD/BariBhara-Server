import express, { type Application } from "express";
import "dotenv/config";
import "../config/database.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import passport from "passport";
import userRoutes from "../routes/user.routes.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
const app: Application = express();


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

// home route

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// auth routes
app.use("/api/auth/", userRoutes);

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
