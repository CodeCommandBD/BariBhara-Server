import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { isAdmin } from "../middleware/isAdmin.js";
import { trackEvent, getAnalyticsDashboard } from "../controller/analytics.controller.js";
import { generalLimiter } from "../middleware/rateLimiter.js";

const analyticsRouter = express.Router();

// ১. Public: Track events from the frontend (rate-limited to prevent abuse)
analyticsRouter.post("/track", generalLimiter, trackEvent);

// ২. Admin only: Get aggregated analytics dashboard data
analyticsRouter.get("/dashboard", isAuthenticated, isAdmin, getAnalyticsDashboard);

export default analyticsRouter;
