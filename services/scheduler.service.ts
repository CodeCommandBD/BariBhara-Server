import cron from "node-cron";
import Tenant from "../models/tenant.model.js";
import Invoice from "../models/invoice.model.js";
import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import nodemailer from "nodemailer";
import { sendRentReminderEmail } from "./email.service.js";
import { sendPushNotification } from "../controller/push.controller.js";

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendLeaseExpiryEmail = async (ownerEmail: string, tenantName: string, daysLeft: number) => {
  try {
    await transporter.sendMail({
      from: `"Bari Bhara" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `⚠️ ${tenantName}-এর লিজ ${daysLeft} দিনের মধ্যে শেষ হবে`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 480px;">
          <h2 style="color: #7c3aed;">🏠 Bari Bhara — লিজ মেয়াদ সতর্কতা</h2>
          <p style="color: #374151;">প্রিয় বাড়িওয়ালা,</p>
          <p><strong>${tenantName}</strong>-এর লিজ আর মাত্র <strong style="color: #dc2626;">${daysLeft} দিন</strong> পরে শেষ হবে।</p>
          <p>দয়া করে এখনই লিজ নবায়ন করুন বা ভাড়াটিয়ার সাথে যোগাযোগ করুন।</p>
          <a href="http://localhost:5173/tenants" 
             style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 16px;">
            ড্যাশবোর্ডে যান
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("Email error:", err);
  }
};

export const startScheduler = () => {
  // প্রতিদিন রাত ১২টায় চেক করবে
  cron.schedule("0 0 * * *", async () => {
    console.log("🕐 Lease scheduler running...");

    try {
      const now = new Date();
      const in30Days = new Date(); in30Days.setDate(in30Days.getDate() + 30);
      const in7Days = new Date(); in7Days.setDate(in7Days.getDate() + 7);
      const in1Day = new Date(); in1Day.setDate(in1Day.getDate() + 1);

      // সব সক্রিয় ভাড়াটিয়া যাদের leaseEnd আছে
      const tenants = await Tenant.find({
        status: "সক্রিয়",
        leaseEnd: { $exists: true, $ne: null },
      })
        .populate("owner", "email fullName")
        .populate("property", "name");

      for (const tenant of tenants) {
        const leaseEnd = new Date(tenant.leaseEnd as Date);
        const msLeft = leaseEnd.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        const ownerEmail = (tenant.owner as any)?.email;

        // ৩০ দিন, ৭ দিন, ১ দিন আগে Email notification
        if ([30, 7, 1].includes(daysLeft) && ownerEmail) {
          await sendLeaseExpiryEmail(ownerEmail, tenant.name, daysLeft);
        }

        // Auto-renewal: লিজ শেষ হয়ে গেলে
        if (daysLeft <= 0 && (tenant as any).autoRenew) {
          const renewMonths = (tenant as any).renewalMonths ?? 12;
          const newEnd = new Date(leaseEnd);
          newEnd.setMonth(newEnd.getMonth() + renewMonths);
          tenant.leaseEnd = newEnd;
          await tenant.save();
          console.log(`✅ Auto-renewed: ${tenant.name} — new end: ${newEnd.toLocaleDateString()}`);
        }
      }

      console.log(`✅ Lease scheduler done. Checked ${tenants.length} tenants.`);
    } catch (err) {
      console.error("❌ Lease scheduler error:", err);
    }
  }, {
    timezone: "Asia/Dhaka"
  });

  console.log("✅ Lease auto-renewal scheduler started (runs daily at midnight).");

  // --- ২. অটো-ইনভয়েস জেনারেটর ---
  // প্রতি মাসের ১ তারিখ রাত ১২:০০ মিনিটে চলে (0 0 1 * *)
  cron.schedule("0 0 1 * *", async () => {
    console.log("🚀 Running Auto-Invoice Generation...");
    try {
      const activeTenants = await Tenant.find({ status: "সক্রিয়" });
      const currentMonth = new Date().toLocaleString("en-us", { month: "long" });
      const currentYear = new Date().getFullYear();

      for (const tenant of activeTenants) {
        const existing = await Invoice.findOne({ tenant: tenant._id, month: currentMonth, year: currentYear });
        if (!existing) {
          await Invoice.create({
            tenant: tenant._id,
            unit: tenant.unit,
            property: tenant.property,
            owner: tenant.owner,
            month: currentMonth,
            year: currentYear,
            baseRent: tenant.rentAmount,
            totalAmount: tenant.rentAmount,
            dueAmount: tenant.rentAmount,
            status: "Unpaid",
            dueDate: new Date(currentYear, new Date().getMonth(), 10),
          });
        }
      }
      console.log("✅ Auto-Invoice generation complete.");
    } catch (err) {
      console.error("❌ Auto-Invoice error:", err);
    }
  }, { timezone: "Asia/Dhaka" });

  // --- ৩. রেন্ট ডিউ রিমাইন্ডার (প্রতিদিন সকাল ৯টায়) ---
  cron.schedule("0 9 * * *", async () => {
    console.log("📧 Running Rent Due Reminder scheduler...");
    try {
      const now = new Date();
      const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      // যে ইনভয়েসগুলো unpaid/partial এবং dueDate আছে
      const invoices = await Invoice.find({
        status: { $in: ["Unpaid", "Partial"] },
        dueDate: { $exists: true, $ne: null },
      })
        .populate("tenant", "name email phone")
        .populate("property", "name")
        .populate("unit", "unitName")
        .populate("owner", "email fullName");

      let sent = 0;

      for (const invoice of invoices) {
        const tenant = invoice.tenant as any;
        const property = invoice.property as any;
        const unit = invoice.unit as any;
        const owner = invoice.owner as any;
        const dueDate = new Date(invoice.dueDate as Date);
        const msLeft = dueDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

        // Duplicate সেন্ড এড়াতে — ২৪ ঘণ্টার মধ্যে পাঠানো হয়েছে কিনা চেক
        const lastReminder = (invoice as any).reminderSentAt;
        const alreadySentRecently =
          lastReminder &&
          now.getTime() - new Date(lastReminder).getTime() < 23 * 60 * 60 * 1000;
        if (alreadySentRecently) continue;

        const shouldSend = daysLeft <= 3; // due in 3 days or overdue
        if (!shouldSend) continue;

        // ভাড়াটিয়াকে রিমাইন্ডার পাঠানো
        if (tenant?.email) {
          const isOverdue = daysLeft < 0;
          await sendRentReminderEmail({
            tenantEmail: tenant.email,
            tenantName: tenant.name,
            dueAmount: invoice.dueAmount,
            propertyName: property?.name ?? "N/A",
            unitName: unit?.unitName ?? "N/A",
            month: invoice.month,
            year: invoice.year,
          });
          sent++;
        }

        // বাড়িওয়ালাকে overdue alert (deadline পার হলে)
        if (daysLeft < 0 && owner?.email) {
          await (async () => {
            const nodemailerTransport = nodemailer.createTransport({
              service: "gmail",
              auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            await nodemailerTransport.sendMail({
              from: `"বাড়িভাড়া" <${process.env.EMAIL_USER}>`,
              to: owner.email,
              subject: `🔴 বকেয়া ভাড়া সতর্কতা — ${tenant?.name} — ${invoice.month} ${invoice.year}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                  <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 28px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 22px;">🔴 বকেয়া ভাড়া সতর্কতা</h1>
                  </div>
                  <div style="padding: 28px;">
                    <p style="color: #333;">প্রিয় <strong>${owner.fullName}</strong>,</p>
                    <p style="color: #666;">আপনার ভাড়াটিয়া <strong>${tenant?.name}</strong> এর <strong>${invoice.month} ${invoice.year}</strong> মাসের ভাড়া <strong style="color: #dc2626;">৳${invoice.dueAmount.toLocaleString()}</strong> এখনো পরিশোধ করা হয়নি।</p>
                    <p style="color: #666;">ডেডলাইন ছিল: <strong>${dueDate.toLocaleDateString("bn-BD")}</strong></p>
                    <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/payments" style="display:inline-block; margin-top:16px; padding:12px 24px; background:#7c3aed; color:white; border-radius:8px; text-decoration:none; font-weight:bold;">ড্যাশবোর্ডে দেখুন</a>
                  </div>
                </div>
              `,
            });
          })();

          // Send Push Notification
          await sendPushNotification(owner._id.toString(), {
            title: "🔴 বকেয়া ভাড়া সতর্কতা",
            body: `ভাড়াটিয়া ${tenant?.name} এর ${invoice.month} মাসের ভাড়া ৳${invoice.dueAmount} বকেয়া আছে।`,
            url: "/rent",
          });
        }

        // reminderSentAt আপডেট করা
        await Invoice.findByIdAndUpdate(invoice._id, { reminderSentAt: now });
      }

      console.log(`✅ Rent reminders sent: ${sent}`);
    } catch (err) {
      console.error("❌ Rent reminder scheduler error:", err);
    }
  }, { timezone: "Asia/Dhaka" });

  console.log("✅ Rent due reminder scheduler started (runs daily at 9 AM).");
};

