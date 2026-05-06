import cron from "node-cron";
import "dotenv/config";
import Invoice from "../models/invoice.model.js";
import { sendRentReminderEmail } from "./email.service.js";

// প্রতিদিন সকাল ৯টায় রেন্ট রিমাইন্ডার পাঠাবে
export const startCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ [CRON] Rent reminder job started...");

    try {
      const today = new Date();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(today.getDate() + 3);

      // আগামী ৩ দিনের মধ্যে ডিউ আছে এমন পেন্ডিং ইনভয়েসগুলো
      const invoices = await Invoice.find({
        status: { $in: ["Pending", "Partial"] },
        dueDate: { $gte: today, $lte: threeDaysLater },
      })
        .populate("tenant", "name email phone")
        .populate("property", "name address");

      console.log(`📋 [CRON] Found ${invoices.length} invoices due soon.`);

      for (const invoice of invoices) {
        const tenant = invoice.tenant as any;
        const property = invoice.property as any;

        // ইমেইল পাঠানো (টেনেন্টের ইমেইল থাকলে)
        if (tenant?.email) {
          try {
            await sendRentReminderEmail({
              tenantEmail: tenant.email,
              tenantName: tenant.name,
              propertyName: property?.name || "N/A",
              unitName: "N/A",
              dueAmount: invoice.totalAmount,
              month: new Date(invoice.dueDate ?? Date.now()).toLocaleDateString("bn-BD", { month: "long" }),
              year: new Date(invoice.dueDate ?? Date.now()).getFullYear(),
            });
            console.log(`✅ [CRON] Reminder sent to ${tenant.name} (${tenant.email})`);
          } catch (err) {
            console.error(`❌ [CRON] Failed for ${tenant.email}:`, err);
          }
        }
      }

      console.log("✅ [CRON] Rent reminder job completed.");
    } catch (error) {
      console.error("❌ [CRON] Job failed:", error);
    }
  }, {
    timezone: "Asia/Dhaka",
  });

  console.log("✅ Cron jobs initialized (Daily rent reminders @ 9 AM BDT)");
};
