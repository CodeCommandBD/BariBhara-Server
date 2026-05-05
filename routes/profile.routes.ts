import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getProfile, updateProfile, updateProfilePhoto, changePassword } from "../controller/profile.controller.js";
import multer from "multer";

const profileRouter = express.Router();

// মালটার (ছবি আপলোডের জন্য) — temp ডিস্কে সেভ করবে
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // ৫ MB লিমিট

// ১. প্রোফাইল দেখা
profileRouter.get("/me", isAuthenticated, getProfile);

// ২. প্রোফাইল তথ্য আপডেট
profileRouter.patch("/update", isAuthenticated, updateProfile);

// ৩. প্রোফাইল ছবি আপডেট
profileRouter.patch("/photo", isAuthenticated, upload.single("photo"), updateProfilePhoto);

// ৪. পাসওয়ার্ড পরিবর্তন
profileRouter.patch("/password", isAuthenticated, changePassword);

export default profileRouter;
