import { Router } from "express";
import {
  getPublicProperties,
  getPublicStats,
  getPublicPlans,
} from "../controller/public.controller.js";
import { getSystemSettings } from "../controller/systemSettings.controller.js";

const publicRouter: Router = Router();

// ১. পাবলিক প্রোপার্টি লিস্টিং এপিআই (মার্কেটপ্লেস)
publicRouter.get("/properties", getPublicProperties);

// ২. প্ল্যাটফর্ম লাইভ স্ট্যাটিস্টিকস
publicRouter.get("/stats", getPublicStats);

// ৩. সাবস্ক্রিপশন প্ল্যান তালিকা
publicRouter.get("/plans", getPublicPlans);

// ৪. সিস্টেম সেটিংস (পেমেন্ট নম্বর)
publicRouter.get("/system-settings", getSystemSettings);

export default publicRouter;
