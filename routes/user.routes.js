import { Router } from "express";
import { registerUser, loginUser, forgotPassword, verifyResetOTP, resetPassword } from "../controller/user.controller.js";
import { validate } from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../middleware/validate.js";
const router = Router();
// ভ্যালিডেশন সহ রেজিস্ট্রেশন
router.post("/register", validate(registerSchema), registerUser);
// ভ্যালিডেশন সহ লগইন
router.post("/login", validate(loginSchema), loginUser);
// পাসওয়ার্ড রিসেট রাউটসমূহ
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);
export default router;
//# sourceMappingURL=user.routes.js.map