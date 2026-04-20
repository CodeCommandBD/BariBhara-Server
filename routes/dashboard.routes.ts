import { Router } from "express"; // এক্সপ্রেস রাউটার ইমপোর্ট
import passport from "passport"; // পাসপোর্ট ইমপোর্ট (সিকিউরিটির জন্য)
import { getLandlordStats } from "../controller/dashboard.controller.js"; // কন্ট্রোলার ইমপোর্ট

const dashboardRouter: Router = Router(); // নতুন একটি রাউটার তৈরি

// /stats ঠিকানায় GET রিকোয়েস্ট আসলে এটি কাজ করবে
dashboardRouter.get(
  "/stats",
  // পাসপোর্ট নিশ্চিত করবে যে ইউজার লগইন করা আছে (JWT টোকেন চেক করবে)
  passport.authenticate("jwt", { session: false }),

  // যদি ইউজার ভ্যালিড হয়, তবে ওপরের কন্ট্রোলার ফাংশনটি চলবে
  getLandlordStats,
);

export default dashboardRouter; // রাউটারটি এক্সপোর্ট করো