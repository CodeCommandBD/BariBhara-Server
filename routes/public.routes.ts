import { Router } from "express";
import {
  getPublicProperties,
  getPublicPropertyById,
  getPublicStats,
  getPublicPlans,
} from "../controller/public.controller.js";
import { getSystemSettings } from "../controller/systemSettings.controller.js";

const publicRouter: Router = Router();

// ১. পাবলিক প্রোপার্টি লিস্টিং এপিআই (মার্কেটপ্লেস + সার্চ)
publicRouter.get("/properties", getPublicProperties);

// ১ক. একটি নির্দিষ্ট প্রপার্টির বিস্তারিত
publicRouter.get("/properties/:id", getPublicPropertyById);

// ২. প্ল্যাটফর্ম লাইভ স্ট্যাটিস্টিকস
publicRouter.get("/stats", getPublicStats);

// ৩. সাবস্ক্রিপশন প্ল্যান তালিকা
publicRouter.get("/plans", getPublicPlans);

// ৪. সিস্টেম সেটিংস (পেমেন্ট নম্বর)
publicRouter.get("/system-settings", getSystemSettings);

export default publicRouter;

