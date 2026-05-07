import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // কাকে পাঠাবে
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // নোটিফিকেশন টাইপ
    type: {
      type: String,
      enum: [
        "payment_received",     // পেমেন্ট গ্রহণ
        "invoice_generated",    // নতুন বিল তৈরি
        "maintenance_update",   // মেইনটেন্যান্স আপডেট
        "lease_expiry",         // লিজ শেষ হচ্ছে
        "tenant_added",         // নতুন ভাড়াটিয়া যোগ
        "tenant_vacated",       // ভাড়াটিয়া চলে গেল
        "reminder_sent",        // রিমাইন্ডার পাঠানো হয়েছে
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    // extra data (optional)
    meta: {
      invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
      tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
      propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
      amount: Number,
      url: String, // frontend redirect url
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ৩০ দিনের পুরনো নোটিফিকেশন auto-delete
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
