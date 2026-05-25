import express, { type Application } from "express";
import "dotenv/config";
import "../config/database.js";
import "../config/passport.js";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";

// Routers
import userRoutes from "../routes/user.routes.js";
import propertyRouter from "../routes/property.routes.js";
import unitRouter from "../routes/unit.routes.js";
import dashboardRouter from "../routes/dashboard.routes.js";
import tenantRouter from "../routes/tenant.routes.js";
import rentRouter from "../routes/rent.routes.js";
import expenseRouter from "../routes/expense.routes.js";
import reportsRouter from "../routes/reports.routes.js";
import profileRouter from "../routes/profile.routes.js";
import maintenanceRouter from "../routes/maintenance.routes.js";
import searchRouter from "../routes/search.routes.js";
import notificationsRouter from "../routes/notifications.routes.js";
import tenantPortalRouter from "../routes/tenantPortal.routes.js";
import bulkRouter from "../routes/bulk.routes.js";
import documentRouter from "../routes/document.routes.js";
import twofaRouter from "../routes/twofa.routes.js";
import whatsappRouter from "../routes/whatsapp.routes.js";
import subscriptionRouter from "../routes/subscription.routes.js";
import adminRouter from "../routes/admin.routes.js";
import publicRouter from "../routes/public.routes.js";
import { startScheduler } from "../services/scheduler.service.js";
import { seedAdmin } from "../services/seedAdmin.js";
import { seedPlans } from "../services/seedPlans.js";

// Middleware
import { generalLimiter, authLimiter, searchLimiter } from "../middleware/rateLimiter.js";

const app: Application = express();

// ==========================================
// Security Middleware (সিকিউরিটি লেয়ার)
// ==========================================

// ১. Helmet — HTTP সিকিউরিটি হেডার সেট করা
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // static files এর জন্য
  contentSecurityPolicy: false, // frontend এর জন্য বন্ধ রাখা
}));

// ২. CORS — শুধু অনুমোদিত উৎস থেকে রিকোয়েস্ট
app.use(cors({
  origin: [
    "http://localhost:5173",  // Vite dev server
    "http://localhost:3000",  // fallback
    process.env.FRONTEND_URL || "",
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ৩. Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" })); // JSON size সীমা

// ৪. Passport Initialize
app.use(passport.initialize());

// ৫. Static Files
app.use("/uploads", express.static("uploads"));

// ৬. সব API-তে General Rate Limit
app.use("/api", generalLimiter);

// ==========================================
// Home Route
// ==========================================
app.get("/", (req, res) => {
  res.json({ success: true, message: "🏠 Bariowla API is running!", version: "2.0.0" });
});

// ==========================================
// API Routes (এপিআই রাউটসমূহ)
// ==========================================

// ১. Auth — বিশেষ কঠোর রেট লিমিট
app.use("/api/auth/", authLimiter, userRoutes);

// ২. প্রপার্টি ম্যানেজমেন্ট
app.use("/api/property", propertyRouter);

// ৩. ইউনিট ম্যানেজমেন্ট
app.use("/api/unit", unitRouter);

// ৪. ড্যাশবোর্ড
app.use("/api/dashboard", dashboardRouter);

// ৫. ভাড়াটিয়া ম্যানেজমেন্ট
app.use("/api/tenant", tenantRouter);

// ৬. ভাড়া ও পেমেন্ট
app.use("/api/rent", rentRouter);

// ৭. খরচ ট্র্যাকিং
app.use("/api/expense", expenseRouter);

// ৮. রিপোর্ট
app.use("/api/reports", reportsRouter);

// ৯. প্রোফাইল ও সেটিংস
app.use("/api/profile", profileRouter);

// ১১. মেইনটেন্যান্স ট্র্যাকিং
app.use("/api/maintenance", maintenanceRouter);

// ১২. গ্লোবাল সার্চ — বিশেষ সার্চ রেট লিমিট
app.use("/api/search", searchLimiter, searchRouter);

// ১৩. Real-time Notifications
app.use("/api/notifications", notificationsRouter);

// ১৪. Tenant Portal
app.use("/api/tenant-portal", tenantPortalRouter);

// ১৫. Bulk Operations & Lease Management
app.use("/api/bulk", bulkRouter);

// ১৬. Document Management
app.use("/api/documents", documentRouter);

// ১৭. Two-Factor Authentication — বিশেষ কঠোর রেট লিমিট
app.use("/api/2fa", authLimiter, twofaRouter);

// NoSQL Injection Protection (কাস্টম মিডলওয়্যার)
app.use((req, res, next) => {
  const sanitize = (obj: any) => {
    if (obj instanceof Object) {
      for (const key in obj) {
        if (key.startsWith("$")) delete obj[key];
        else sanitize(obj[key]);
      }
    }
  };
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  next();
});

// ১৮. WhatsApp Bot Integration
app.use("/api/whatsapp", whatsappRouter);

// ১৯. Subscription & Payments
app.use("/api/subscription", subscriptionRouter);

// ২০. Admin Routes
app.use("/api/admin", adminRouter);

// ২১. Public Routes
app.use("/api/public", publicRouter);

// ২১. Start Scheduler (Lease Auto-renewal)
startScheduler();

// ২২. Seed Default Admin
seedAdmin();
seedPlans();

// ==========================================
// Error Handlers
// ==========================================

// ৪০৪ — পেজ পাওয়া যায়নি
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "রিসোর্স পাওয়া যায়নি!",
    path: req.originalUrl,
  });
});

// ৫০০ — সার্ভার এরর
app.use((err: any, req: any, res: any, next: any) => {
  console.error("❌ Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "সার্ভারে সমস্যা হয়েছে!",
  });
});

export default app;
