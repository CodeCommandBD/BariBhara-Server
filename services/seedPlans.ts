import Plan from "../models/plan.model.js";

export async function seedPlans() {
  try {
    const count = await Plan.countDocuments();
    if (count > 0) {
      console.log("ℹ️ Subscription plans already seeded.");
      return;
    }

    const defaultPlans = [
      {
        name: "free",
        title: "ফ্রি প্ল্যান",
        price: 0,
        billingCycle: "forever",
        features: [
          "১টি বিল্ডিং লিস্টিং",
          "২ জন ভাড়াটিয়া ম্যানেজমেন্ট",
          "বেসিক ড্যাশবোর্ড সুবিধা",
          "এসএমএস ও ইমেইল নোটিফিকেশন নেই"
        ],
        limits: {
          maxProperties: 1,
          maxTenants: 2
        }
      },
      {
        name: "pro",
        title: "প্রো প্ল্যান",
        price: 999,
        billingCycle: "monthly",
        features: [
          "অনলিমিটেড বিল্ডিং লিস্টিং",
          "অনলিমিটেড ভাড়াটিয়া ম্যানেজমেন্ট",
          "এসএমএস ও ইমেইল এলার্ট",
          "সব প্রিমিয়াম ফিচার আনলক 💎"
        ],
        limits: {
          maxProperties: -1,
          maxTenants: -1
        }
      }
    ];

    await Plan.insertMany(defaultPlans);
    console.log("✅ Subscription plans seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
  }
}
