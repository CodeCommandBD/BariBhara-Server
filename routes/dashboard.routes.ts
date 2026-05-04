import { Router } from "express";
import passport from "passport";
import {
  getLandlordStats,
  getRevenueAnalytics,
  getRecentTransactions,
  getLeaseExpiryAlerts,
} from "../controller/dashboard.controller.js";

const dashboardRouter: Router = Router();

const jwtAuth = passport.authenticate("jwt", { session: false });

// ১. মূল স্ট্যাটস (মোট প্রপার্টি, ইউনিট, আয়, বকেয়া)
dashboardRouter.get("/stats", jwtAuth, getLandlordStats);

// ২. গত ৬ মাসের আয়ের ট্রেন্ড
dashboardRouter.get("/revenue-analytics", jwtAuth, getRevenueAnalytics);

// ৩. সাম্প্রতিক ট্রানজেকশন
dashboardRouter.get("/recent-transactions", jwtAuth, getRecentTransactions);

// ৪. লিজ এক্সপায়ারি অ্যালার্ট
dashboardRouter.get("/lease-alerts", jwtAuth, getLeaseExpiryAlerts);

export default dashboardRouter;