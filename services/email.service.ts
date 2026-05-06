import nodemailer from "nodemailer";

// Gmail SMTP ট্রান্সপোর্টার তৈরি
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// ইমেইল টেমপ্লেট হেলপার
const getBaseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #702ae1, #b00d6a); padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .card { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 13px; }
    .value { font-weight: bold; color: #333; font-size: 13px; }
    .amount { font-size: 28px; font-weight: 900; color: #702ae1; text-align: center; padding: 20px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    .btn { display: inline-block; padding: 12px 24px; background: #702ae1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏠 বাড়িওয়ালা</h1>
      <p>Bariowla Property Management</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>এই ইমেইলটি <strong>বাড়িওয়ালা</strong> সিস্টেম থেকে স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে।</p>
      <p>© ${new Date().getFullYear()} Bariowla. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

// ১. পেমেন্ট রিসিট ইমেইল
export const sendPaymentReceiptEmail = async (data: {
  tenantEmail: string;
  tenantName: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  propertyName: string;
  unitName: string;
  month: string;
  year: number;
  paidDate: Date;
  remainingDue: number;
}) => {
  const content = `
    <h2 style="color: #333; margin-bottom: 4px;">পেমেন্ট নিশ্চিতকরণ ✅</h2>
    <p style="color: #666; margin-bottom: 24px;">প্রিয় <strong>${data.tenantName}</strong>, আপনার পেমেন্ট সফলভাবে গৃহীত হয়েছে।</p>
    
    <div class="amount">৳ ${data.amount.toLocaleString()}</div>
    
    <div class="card">
      <div class="row">
        <span class="label">প্রপার্টি</span>
        <span class="value">${data.propertyName}</span>
      </div>
      <div class="row">
        <span class="label">ইউনিট</span>
        <span class="value">${data.unitName}</span>
      </div>
      <div class="row">
        <span class="label">মাস</span>
        <span class="value">${data.month} ${data.year}</span>
      </div>
      <div class="row">
        <span class="label">পেমেন্ট তারিখ</span>
        <span class="value">${new Date(data.paidDate).toLocaleDateString("bn-BD")}</span>
      </div>
      <div class="row">
        <span class="label">পেমেন্ট পদ্ধতি</span>
        <span class="value"><span class="badge badge-success">${data.paymentMethod}</span></span>
      </div>
      ${data.transactionId ? `
      <div class="row">
        <span class="label">ট্রানজেকশন আইডি</span>
        <span class="value">${data.transactionId}</span>
      </div>` : ""}
      <div class="row">
        <span class="label">অবশিষ্ট বকেয়া</span>
        <span class="value" style="color: ${data.remainingDue > 0 ? "#dc2626" : "#059669"}">
          ৳ ${data.remainingDue.toLocaleString()}
          ${data.remainingDue === 0 ? ' ✓' : ''}
        </span>
      </div>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 16px;">ধন্যবাদ আপনার সময়মতো পেমেন্টের জন্য।</p>
  `;

  await transporter.sendMail({
    from: `"বাড়িওয়ালা" <${process.env.EMAIL_USER}>`,
    to: data.tenantEmail,
    subject: `✅ পেমেন্ট গৃহীত — ৳${data.amount.toLocaleString()} | ${data.month} ${data.year}`,
    html: getBaseTemplate(content),
  });
};

// ২. ভাড়া বাকির রিমাইন্ডার ইমেইল
export const sendRentReminderEmail = async (data: {
  tenantEmail: string;
  tenantName: string;
  dueAmount: number;
  propertyName: string;
  unitName: string;
  month: string;
  year: number;
}) => {
  const content = `
    <h2 style="color: #333; margin-bottom: 4px;">ভাড়া পরিশোধের অনুরোধ 🔔</h2>
    <p style="color: #666; margin-bottom: 24px;">প্রিয় <strong>${data.tenantName}</strong>, আপনার ভাড়া এখনো বাকি আছে।</p>
    
    <div class="amount" style="color: #dc2626;">৳ ${data.dueAmount.toLocaleString()}</div>
    
    <div class="card">
      <div class="row">
        <span class="label">প্রপার্টি</span>
        <span class="value">${data.propertyName}</span>
      </div>
      <div class="row">
        <span class="label">ইউনিট</span>
        <span class="value">${data.unitName}</span>
      </div>
      <div class="row">
        <span class="label">বকেয়া মাস</span>
        <span class="value">${data.month} ${data.year}</span>
      </div>
      <div class="row">
        <span class="label">স্ট্যাটাস</span>
        <span class="value"><span class="badge badge-warning">⚠️ বকেয়া</span></span>
      </div>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 16px;">অনুগ্রহ করে যত শীঘ্রই সম্ভব ভাড়া পরিশোধ করুন।</p>
  `;

  await transporter.sendMail({
    from: `"বাড়িওয়ালা" <${process.env.EMAIL_USER}>`,
    to: data.tenantEmail,
    subject: `⚠️ ভাড়া বাকি — ৳${data.dueAmount.toLocaleString()} | ${data.month} ${data.year}`,
    html: getBaseTemplate(content),
  });
};

// ৩. লিজ এক্সপায়ারি রিমাইন্ডার ইমেইল
export const sendLeaseExpiryEmail = async (data: {
  tenantEmail: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  leaseEnd: Date;
  daysLeft: number;
}) => {
  const content = `
    <h2 style="color: #333; margin-bottom: 4px;">চুক্তির মেয়াদ শেষ হচ্ছে ⏰</h2>
    <p style="color: #666; margin-bottom: 24px;">প্রিয় <strong>${data.tenantName}</strong>, আপনার চুক্তির মেয়াদ শীঘ্রই শেষ হবে।</p>
    
    <div class="amount" style="color: #d97706;">${data.daysLeft} দিন বাকি</div>
    
    <div class="card">
      <div class="row">
        <span class="label">প্রপার্টি</span>
        <span class="value">${data.propertyName}</span>
      </div>
      <div class="row">
        <span class="label">ইউনিট</span>
        <span class="value">${data.unitName}</span>
      </div>
      <div class="row">
        <span class="label">চুক্তি শেষ</span>
        <span class="value">${new Date(data.leaseEnd).toLocaleDateString("bn-BD")}</span>
      </div>
    </div>
    <p style="color: #666; font-size: 13px; margin-top: 16px;">চুক্তি নবায়নের জন্য আপনার মালিকের সাথে যোগাযোগ করুন।</p>
  `;

  await transporter.sendMail({
    from: `"বাড়িওয়ালা" <${process.env.EMAIL_USER}>`,
    to: data.tenantEmail,
    subject: `⏰ চুক্তির মেয়াদ শেষ হচ্ছে — ${data.daysLeft} দিন বাকি`,
    html: getBaseTemplate(content),
  });
};

