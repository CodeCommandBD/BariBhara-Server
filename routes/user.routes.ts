import { Router } from "express";
import { registerUser, loginUser } from "../controller/user.controller.js";
import { validate } from "../middleware/validationMiddleware.js";
import { registerSchema, loginSchema } from "../middleware/validate.js";

const router: Router = Router();

// ভ্যালিডেশন সহ রেজিস্ট্রেশন
router.post("/register", validate(registerSchema), registerUser);

// ভ্যালিডেশন সহ লগইন
router.post("/login", validate(loginSchema), loginUser);

export default router;