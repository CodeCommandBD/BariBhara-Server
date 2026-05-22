import express from "express";
import { getWhatsAppStatus, logoutWhatsApp, sendTestMessage } from "../controller/whatsapp.controller.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
const router = express.Router();
// Only owner/admin should manage WhatsApp connection
router.get("/status", isAuthenticated, getWhatsAppStatus);
router.post("/logout", isAuthenticated, logoutWhatsApp);
router.post("/test-message", isAuthenticated, sendTestMessage);
export default router;
//# sourceMappingURL=whatsapp.routes.js.map