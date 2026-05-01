import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../middleware/upload.js";
import {
  addTenant,
  getAllTenants,
  getTenantByUnit,
  updateTenant,
  vacateTenant,
} from "../controller/tenant.controller.js";

const tenantRouter = express.Router();

// নতুন ভাড়াটিয়া যোগ করা (ছবি আপলোড সহ)
tenantRouter.post("/add", isAuthenticated, upload.array("photo", 1), addTenant);

// একজন মালিকের সকল সক্রিয় ভাড়াটিয়া
tenantRouter.get("/all", isAuthenticated, getAllTenants);

// একটি নির্দিষ্ট ইউনিটের ভাড়াটিয়া
tenantRouter.get("/unit/:unitId", isAuthenticated, getTenantByUnit);

// ভাড়াটিয়ার তথ্য আপডেট
tenantRouter.put("/:id", isAuthenticated, upload.array("photo", 1), updateTenant);

// ভাড়াটিয়া সরানো (ইউনিট খালি করা)
tenantRouter.patch("/vacate/:id", isAuthenticated, vacateTenant);

export default tenantRouter;
