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
} from "../controller/tenantPortal.controller.js";

const tenantPortalRouter = express.Router();

// ====================================================
// Public Route — Login (কোনো auth লাগবে না)
// ====================================================
tenantPortalRouter.post("/login", tenantLogin);

// ====================================================
// Tenant Protected Routes (isTenantAuthenticated)
// ====================================================
tenantPortalRouter.get("/dashboard", isTenantAuthenticated, getTenantDashboard);
tenantPortalRouter.get("/invoices", isTenantAuthenticated, getTenantInvoices);
tenantPortalRouter.get("/invoices/:invoiceId/pdf", isTenantAuthenticated, downloadTenantInvoicePDF);
tenantPortalRouter.get("/maintenance", isTenantAuthenticated, getTenantMaintenance);
tenantPortalRouter.post("/maintenance", isTenantAuthenticated, tenantCreateMaintenance);

// ====================================================
// Landlord Route — Portal Access Management
// ====================================================
tenantPortalRouter.patch("/access/:tenantId", isAuthenticated, setTenantPortalAccess);

export default tenantPortalRouter;
