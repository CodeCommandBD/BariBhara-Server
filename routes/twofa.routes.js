import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { sendOTP, verifyOTP, toggle2FA, verifyLoginOTP, sendLoginOTP } from "../controller/twofa.controller.js";
const twofaRouter = express.Router();
// Public (login flow)
twofaRouter.post("/send-login-otp", sendLoginOTP);
twofaRouter.post("/verify-login-otp", verifyLoginOTP);
// Protected (settings)
twofaRouter.post("/send-otp", isAuthenticated, sendOTP);
twofaRouter.post("/verify-otp", isAuthenticated, verifyOTP);
twofaRouter.patch("/toggle", isAuthenticated, toggle2FA);
export default twofaRouter;
//# sourceMappingURL=twofa.routes.js.map