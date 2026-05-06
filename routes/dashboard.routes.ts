import { Router } from "express";
import passport from "passport";
import {
  getLandlordStats,
  getRevenueAnalytics,
  getRecentTransactions,
  getLeaseExpiryAlerts,
} from "../controller/dashboard.controller.js";
import { dashboardLimiter } from "../middleware/rateLimiter.js";

const dashboardRouter: Router = Router();

const jwtAuth = passport.authenticate("jwt", { session: false });

// সব ড্যাশবোর্ড রাউটে rate limiting ও caching প্রযোজ্য

// ১. মূল স্ট্যাটস — ক্যাশ: ৩ মিনিট
dashboardRouter.get("/stats", jwtAuth, dashboardLimiter, getLandlordStats);

// ২. গত ৬ মাসের আয়ের ট্রেন্ড — ক্যাশ: ১০ মিনিট
dashboardRouter.get("/revenue-analytics", jwtAuth, dashboardLimiter, getRevenueAnalytics);

// ৩. সাম্প্রতিক ট্রানজেকশন — ক্যাশ: ২ মিনিট
dashboardRouter.get("/recent-transactions", jwtAuth, dashboardLimiter, getRecentTransactions);

// ৪. লিজ এক্সপায়ারি অ্যালার্ট — ক্যাশ: ৫ মিনিট
dashboardRouter.get("/lease-alerts", jwtAuth, dashboardLimiter, getLeaseExpiryAlerts);

export default dashboardRouter;