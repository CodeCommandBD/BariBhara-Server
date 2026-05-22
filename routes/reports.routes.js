import express from "express";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import { getFinancialReport, getPropertiesForFilter, exportTransactionsCSV, exportExpensesCSV, getMonthlyTrend, getOccupancyStats, exportExcel, } from "../controller/reports.controller.js";
const reportsRouter = express.Router();
// ১. ফিনান্সিয়াল রিপোর্ট (তারিখ ও প্রপার্টি ফিল্টার)
reportsRouter.get("/financial", isAuthenticated, getFinancialReport);
// ২. প্রপার্টি লিস্ট (ফিল্টার ড্রপডাউনের জন্য)
reportsRouter.get("/properties", isAuthenticated, getPropertiesForFilter);
// ৩. ট্রান্জাকশন CSV ডাউনলোড
reportsRouter.get("/export/transactions", isAuthenticated, exportTransactionsCSV);
// ৪. খরচ CSV ডাউনলোড
reportsRouter.get("/export/expenses", isAuthenticated, exportExpensesCSV);
// ৫. মাসিক ট্রেন্ড (গত ১২ মাস)
reportsRouter.get("/monthly-trend", isAuthenticated, getMonthlyTrend);
// ৬. Occupancy Rate
reportsRouter.get("/occupancy", isAuthenticated, getOccupancyStats);
// ৭. Excel Export
reportsRouter.get("/export/excel", isAuthenticated, exportExcel);
export default reportsRouter;
//# sourceMappingURL=reports.routes.js.map