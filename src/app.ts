import express, { type Application } from "express";
import "dotenv/config";
import "../config/database.js";
import "../config/passport.js"; 
import cors from "cors";
import passport from "passport";
import userRoutes from "../routes/user.routes.js";

import propertyRouter from "../routes/property.routes.js";
import unitRouter from "../routes/unit.routes.js";
import dashboardRouter from "../routes/dashboard.routes.js";
import tenantRouter from "../routes/tenant.routes.js"; // ভাড়াটিয়া রাউট ইমপোর্ট
import rentRouter from "../routes/rent.routes.js";
import expenseRouter from "../routes/expense.routes.js";
import reportsRouter from "../routes/reports.routes.js";

const app: Application = express();


app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());

// ছবি দেখার জন্য আপলোডস ফোল্ডারকে স্ট্যাটিক করা হলো
app.use("/uploads", express.static("uploads"));

// home route
app.get("/", (req, res) => {
  res.send("Hello World!");
});


// ==========================================
// API Routes (এপিআই রাউটসমূহ)
// ==========================================

// ১. ইউজার এবং অথেন্টিকেশন রাউট (User Registration & Login)
app.use("/api/auth/", userRoutes);

// ২. বাড়ি বা প্রপার্টি ম্যানেজমেন্ট রাউট (Building & Property Management)
app.use("/api/property", propertyRouter);

// ৩. ফ্ল্যাট বা ইউনিট ম্যানেজমেন্ট রাউট (Flats, Rooms & Units Management)
app.use("/api/unit", unitRouter);

// ৪. ড্যাশবোর্ড রাউট (Dashboard Management)
app.use('/api/dashboard', dashboardRouter);

// ৫. ভাড়াটিয়া ম্যানেজমেন্ট রাউট (Tenant Management)
app.use('/api/tenant', tenantRouter);

// ৬. ভাড়া ও পেমেন্ট ম্যানেজমেন্ট রাউট (Rent & Payment Management)
app.use('/api/rent', rentRouter);

// ৭. খরচ ট্র্যাকিং রাউট (Expense Tracking)
app.use('/api/expense', expenseRouter);

// ৮. রিপোর্ট রাউট (Reports & Analytics)
app.use('/api/reports', reportsRouter);




// protected route
app.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Profile route reached!",
      user: req.user,
    });
  },
);

// logout route
app.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Logout successful!",
    });
  },
);

// resourse not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Resourse not found!",
  });
});

// global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.log(err);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

export default app;
