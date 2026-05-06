import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getProfile, updateProfile, updateProfilePhoto, changePassword } from "../controller/profile.controller.js";
import multer from "multer";
import { validate } from "../middleware/validationMiddleware.js";
import { updateProfileSchema, changePasswordSchema } from "../middleware/validate.js";
import { uploadLimiter } from "../middleware/rateLimiter.js";

const profileRouter = express.Router();

// মালটার (ছবি আপলোডের জন্য) — temp ডিস্কে সেভ করবে
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `profile-${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // ৫ MB লিমিট

// ১. প্রোফাইল দেখা
profileRouter.get("/me", isAuthenticated, getProfile);

// ২. প্রোফাইল তথ্য আপডেট — ভ্যালিডেশন সহ
profileRouter.patch("/update", isAuthenticated, validate(updateProfileSchema), updateProfile);

// ৩. প্রোফাইল ছবি আপডেট — আপলোড রেট লিমিট সহ
profileRouter.patch("/photo", isAuthenticated, uploadLimiter, upload.single("photo"), updateProfilePhoto);

// ৪. পাসওয়ার্ড পরিবর্তন — ভ্যালিডেশন সহ
profileRouter.patch("/password", isAuthenticated, validate(changePasswordSchema), changePassword);

export default profileRouter;
