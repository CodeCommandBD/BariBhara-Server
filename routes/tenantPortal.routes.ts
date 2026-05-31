import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isTenantAuthenticated } from "../middleware/isTenantAuthenticated.js";
import {
  tenantLogin,
  getTenantDashboard,
  getTenantInvoices,
  downloadTenantInvoicePDF,
  tenantCreateMaintenance,
  getTenantMaintenance,
  setTenantPortalAccess,
  getTenantNotifications,
  markTenantNotificationRead,
  markAllTenantNotificationsRead,
  getTenantProfile,
  updateTenantProfile,
  uploadTenantNID,
  changePortalPassword,
  rateLandlord
} from "../controller/tenantPortal.controller.js";

const tenantPortalRouter = express.Router();

// ====================================================
// Public Route — Login
// ====================================================
tenantPortalRouter.post("/login", tenantLogin);

// ====================================================
// Tenant Protected Routes
// ====================================================
tenantPortalRouter.get("/dashboard", isTenantAuthenticated, getTenantDashboard);
tenantPortalRouter.get("/invoices", isTenantAuthenticated, getTenantInvoices);
tenantPortalRouter.get("/invoices/:invoiceId/pdf", isTenantAuthenticated, downloadTenantInvoicePDF);
tenantPortalRouter.get("/maintenance", isTenantAuthenticated, getTenantMaintenance);
tenantPortalRouter.post("/maintenance", isTenantAuthenticated, tenantCreateMaintenance);

// নোটিফিকেশন রাউট
tenantPortalRouter.get("/notifications", isTenantAuthenticated, getTenantNotifications);
tenantPortalRouter.patch("/notifications/:id/read", isTenantAuthenticated, markTenantNotificationRead);
tenantPortalRouter.patch("/notifications/read-all", isTenantAuthenticated, markAllTenantNotificationsRead);

// প্রোফাইল রাউট
tenantPortalRouter.get("/profile", isTenantAuthenticated, getTenantProfile);
tenantPortalRouter.get("/me", isTenantAuthenticated, getTenantProfile);
tenantPortalRouter.patch("/profile", isTenantAuthenticated, updateTenantProfile);
tenantPortalRouter.post("/nid/upload", isTenantAuthenticated, uploadTenantNID);
tenantPortalRouter.patch("/change-password", isTenantAuthenticated, changePortalPassword);
tenantPortalRouter.patch("/rate-landlord", isTenantAuthenticated, rateLandlord);

// ====================================================
// Landlord Route — Portal Access Management
// ====================================================
tenantPortalRouter.patch("/access/:tenantId", isAuthenticated, setTenantPortalAccess);

export default tenantPortalRouter;

