import cron from "node-cron";
import Tenant from "../models/tenant.model.js";
import Invoice from "../models/invoice.model.js";
import nodemailer from "nodemailer";
// Email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendLeaseExpiryEmail = async (ownerEmail, tenantName, daysLeft) => {
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
    }
    catch (err) {
        console.error("Email error:", err);
    }
};
export const startScheduler = () => {
    // প্রতিদিন রাত ১২টায় চেক করবে
    cron.schedule("0 0 * * *", async () => {
        console.log("🕐 Lease scheduler running...");
        try {
            const now = new Date();
            const in30Days = new Date();
            in30Days.setDate(in30Days.getDate() + 30);
            const in7Days = new Date();
            in7Days.setDate(in7Days.getDate() + 7);
            const in1Day = new Date();
            in1Day.setDate(in1Day.getDate() + 1);
            // সব সক্রিয় ভাড়াটিয়া যাদের leaseEnd আছে
            const tenants = await Tenant.find({
                status: "সক্রিয়",
                leaseEnd: { $exists: true, $ne: null },
            })
                .populate("owner", "email fullName")
                .populate("property", "name");
            for (const tenant of tenants) {
                const leaseEnd = new Date(tenant.leaseEnd);
                const msLeft = leaseEnd.getTime() - now.getTime();
                const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
                const ownerEmail = tenant.owner?.email;
                // ৩০ দিন, ৭ দিন, ১ দিন আগে Email notification
                if ([30, 7, 1].includes(daysLeft) && ownerEmail) {
                    await sendLeaseExpiryEmail(ownerEmail, tenant.name, daysLeft);
                }
                // Auto-renewal: লিজ শেষ হয়ে গেলে
                if (daysLeft <= 0 && tenant.autoRenew) {
                    const renewMonths = tenant.renewalMonths ?? 12;
                    const newEnd = new Date(leaseEnd);
                    newEnd.setMonth(newEnd.getMonth() + renewMonths);
                    tenant.leaseEnd = newEnd;
                    await tenant.save();
                    console.log(`✅ Auto-renewed: ${tenant.name} — new end: ${newEnd.toLocaleDateString()}`);
                }
            }
            console.log(`✅ Lease scheduler done. Checked ${tenants.length} tenants.`);
        }
        catch (err) {
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
        }
        catch (err) {
            console.error("❌ Auto-Invoice error:", err);
        }
    }, { timezone: "Asia/Dhaka" });
};
//# sourceMappingURL=scheduler.service.js.map