import { z } from "zod";

// ============================
// Auth Schemas
// ============================
export const registerSchema = z.object({
  fullName: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(100, "নাম অনেক বড়"),
  email: z.string().email("সঠিক ইমেইল দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
  phone: z.string().optional(),
  role: z.enum(["landlord", "tenant", "manager"]).optional().default("landlord"),
});

export const loginSchema = z.object({
  email: z.string().email("সঠিক ইমেইল দিন"),
  password: z.string().min(1, "পাসওয়ার্ড দিন"),
});

// ============================
// Property Schemas
// ============================
export const createPropertySchema = z.object({
  name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(150, "নাম অনেক বড়"),
  address: z.string().min(5, "সঠিক ঠিকানা দিন"),
  type: z.enum(["Apartment", "House", "Commercial", "Land"]).optional(),
  totalUnits: z.coerce.number().int().positive("ইউনিট সংখ্যা ধনাত্মক হতে হবে").optional(),
  description: z.string().max(500, "বিবরণ অনেক বড়").optional(),
});

// ============================
// Tenant Schemas
// ============================
export const createTenantSchema = z.object({
  name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
  phone: z.string().min(10, "সঠিক ফোন নম্বর দিন"),
  email: z.string().email("সঠিক ইমেইল দিন").optional().or(z.literal("")),
  nid: z.string().optional(),
  property: z.string().min(1, "প্রপার্টি সিলেক্ট করুন"),
  unit: z.string().min(1, "ইউনিট সিলেক্ট করুন"),
  rentAmount: z.coerce.number().positive("ভাড়া ধনাত্মক হতে হবে"),
  leaseStart: z.string().min(1, "চুক্তির শুরু তারিখ দিন"),
  leaseEnd: z.string().min(1, "চুক্তির শেষ তারিখ দিন"),
});

// ============================
// Expense Schema
// ============================
export const createExpenseSchema = z.object({
  property: z.string().min(1, "প্রপার্টি সিলেক্ট করুন"),
  title: z.string().min(2, "বিবরণ কমপক্ষে ২ অক্ষরের হতে হবে"),
  category: z.enum(["মেরামত", "রক্ষণাবেক্ষণ", "পরিষ্কার", "ইলেকট্রিক্যাল", "প্লাম্বিং", "অন্যান্য"]).optional().default("অন্যান্য"),
  amount: z.coerce.number().positive("পরিমাণ ধনাত্মক হতে হবে"),
  expenseDate: z.string().optional(),
  note: z.string().max(300, "নোট অনেক বড়").optional(),
});

// ============================
// Maintenance Schemas
// ============================
export const createMaintenanceSchema = z.object({
  title: z.string().min(2, "সমস্যার বিবরণ দিন"),
  description: z.string().max(500, "বিবরণ অনেক বড়").optional(),
  property: z.string().min(1, "প্রপার্টি সিলেক্ট করুন"),
  unit: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional().default("Medium"),
  cost: z.coerce.number().nonnegative("খরচ শূন্য বা তার বেশি হতে হবে").optional(),
  reportedDate: z.string().optional(),
});

export const updateMaintenanceStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Resolved"], {
    error: "সঠিক স্ট্যাটাস দিন: Pending, In Progress অথবা Resolved",
  }),
  cost: z.coerce.number().nonnegative().optional(),
});

// ============================
// Profile Schemas
// ============================
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে").max(100).optional(),
  phone: z.string().min(10, "সঠিক ফোন নম্বর দিন").optional(),
  bio: z.string().max(300, "বায়ো সর্বোচ্চ ৩০০ অক্ষরের হতে পারে").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "বর্তমান পাসওয়ার্ড দিন"),
  newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

// ============================
// Rent / Invoice Schemas
// ============================
export const collectRentSchema = z.object({
  invoiceId: z.string().min(1, "ইনভয়েস আইডি দিন"),
  amount: z.coerce.number().positive("পরিমাণ ধনাত্মক হতে হবে"),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(["Cash", "Bank Transfer", "Mobile Banking", "Cheque"]).optional(),
  note: z.string().max(200).optional(),
});
