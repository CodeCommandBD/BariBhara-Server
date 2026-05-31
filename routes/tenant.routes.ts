import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isTenantAuthenticated } from "../middleware/isTenantAuthenticated.js";
import upload from "../middleware/upload.js";
import {
  addTenant,
  getAllTenants,
  getTenantByUnit,
  updateTenant,
  vacateTenant,
  toggleAutoRenew,
  renewLease,
  generateAgreement,
  signAgreement,
  deleteAgreement,
  verifyTenantNID,
  updateTenantUtilities,
  rateTenant
} from "../controller/tenant.controller.js";

const tenantRouter = express.Router();

// নতুন ভাড়াটিয়া যোগ করা (ছবি আপলোড সহ)
tenantRouter.post("/add", isAuthenticated, upload.array("photo", 1), addTenant);

// একজন মালিকের সকল সক্রিয় ভাড়াটিয়া
tenantRouter.get("/all", isAuthenticated, getAllTenants);

// একটি নির্দিষ্ট ইউনিটের ভাড়াটিয়া
tenantRouter.get("/unit/:unitId", isAuthenticated, getTenantByUnit);

// ভাড়াতিয়ার তথ্য আপডেট
tenantRouter.put("/:id", isAuthenticated, upload.array("photo", 1), updateTenant);

// NID Verify by Landlord
tenantRouter.patch("/:id/verify-nid", isAuthenticated, verifyTenantNID);

// ইউটিলিটি সেটিংস আপডেট
tenantRouter.patch("/:id/utilities", isAuthenticated, updateTenantUtilities);

// রেটিং আপডেট
tenantRouter.patch("/:id/rating", isAuthenticated, rateTenant);

// ভাড়াটিয়া সরানো (ইউনিট খালি করা)
tenantRouter.patch("/vacate/:id", isAuthenticated, vacateTenant);

// Auto-renew toggle
tenantRouter.patch("/:id/auto-renew", isAuthenticated, toggleAutoRenew);

// Manual renew
tenantRouter.post("/:id/renew-lease", isAuthenticated, renewLease);

// ডিজিটাল চুক্তিপত্র (Digital Agreement)
tenantRouter.post("/:id/generate-agreement", isAuthenticated, generateAgreement);
tenantRouter.post("/sign-agreement", isTenantAuthenticated, signAgreement);
tenantRouter.delete("/:id/agreement", isAuthenticated, deleteAgreement);

export default tenantRouter;
