import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getFinancialReport, getPropertiesForFilter } from "../controller/reports.controller.js";

const reportsRouter = express.Router();

// ১. ফিনান্সিয়াল রিপোর্ট (তারিখ ও প্রপার্টি ফিল্টার)
reportsRouter.get("/financial", isAuthenticated, getFinancialReport);

// ২. প্রপার্টি লিস্ট (ফিল্টার ড্রপডাউনের জন্য)
reportsRouter.get("/properties", isAuthenticated, getPropertiesForFilter);

export default reportsRouter;
