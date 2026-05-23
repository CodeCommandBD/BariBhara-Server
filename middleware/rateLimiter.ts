import rateLimit from "express-rate-limit";

// ১. সাধারণ API লিমিট — প্রতি ১৫ মিনিটে ৫০০০ রিকোয়েস্ট (ডেভেলপমেন্ট ও স্মুথ টেস্টিংয়ের জন্য বর্ধিত)
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ১৫ মিনিট
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "অনেক বেশি রিকোয়েস্ট পাঠানো হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  },
});

// ২. Auth লিমিট — প্রতি ১৫ মিনিটে মাত্র ১০০ বার লগিন/রেজিস্ট্রেশন
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "বারবার লগিন প্রচেষ্টা ব্যর্থ হয়েছে। ১৫ মিনিট পর আবার চেষ্টা করুন।",
  },
});

// ৩. ফাইল আপলোড লিমিট — প্রতি ঘণ্টায় ১০০টি আপলোড
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ১ ঘণ্টা
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "আপলোড সীমা অতিক্রম হয়েছে। ১ ঘণ্টা পর আবার চেষ্টা করুন।",
  },
});

// ৪. সার্চ লিমিট — প্রতি মিনিটে ৩০০টি সার্চ
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // ১ মিনিট
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "অনেক বেশি সার্চ। একটু পর আবার চেষ্টা করুন।",
  },
});

// ৫. ড্যাশবোর্ড লিমিট — প্রতি মিনিটে ৫০০টি (ডেভেলপমেন্ট রিফ্রেশের জন্য বর্ধিত)
export const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // ১ মিনিট
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "ড্যাশবোর্ড অনেক বেশি রিফ্রেশ করা হচ্ছে। একটু অপেক্ষা করুন।",
  },
});
