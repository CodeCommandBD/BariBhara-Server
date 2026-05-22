import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getTenantsForBulk, generateBulkInvoices, toggleAutoRenewal, manualRenewLease, getExpiringLeases, } from "../controller/bulk.controller.js";
const bulkRouter = express.Router();
// Bulk Invoice
bulkRouter.get("/tenants", isAuthenticated, getTenantsForBulk);
bulkRouter.post("/generate-invoices", isAuthenticated, generateBulkInvoices);
// Lease Management
bulkRouter.get("/expiring-leases", isAuthenticated, getExpiringLeases);
bulkRouter.patch("/lease/auto-renew/:tenantId", isAuthenticated, toggleAutoRenewal);
bulkRouter.post("/lease/renew/:tenantId", isAuthenticated, manualRenewLease);
export default bulkRouter;
//# sourceMappingURL=bulk.routes.js.map