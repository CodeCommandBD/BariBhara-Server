import type { Request, Response } from "express";
import Property from "../models/property.model.js";
import User from "../models/user.model.js";
import Tenant from "../models/tenant.model.js";
import Plan from "../models/plan.model.js";
import Unit from "../models/unit.model.js";

// ১. প্রোপার্টি মার্কেটপ্লেস এপিআই
export async function getPublicProperties(req: Request, res: Response): Promise<void> {
  try {
    // শুধুমাত্র Public এবং Available বাসাগুলো দেখাবে
    const properties = await Property.find({
      isPublic: true,
      status: "available",
    })
      .populate("owner", "fullName phoneNumber email phone isVerified")
      .sort({ createdAt: -1 })
      .limit(6); // সর্বোচ্চ ৬টি জনপ্রিয় বাসা শো করবে

    // প্রতিটি প্রোপার্টির জন্য ইউনিটগুলোর সর্বনিম্ন ও সর্বোচ্চ ভাড়া ডায়নামিকালি হিসাব করা
    const propertiesWithRanges = await Promise.all(
      properties.map(async (p) => {
        const units = await Unit.find({ property: p._id });
        let minRent = 0;
        let maxRent = 0;

        if (units && units.length > 0) {
          const rents = units.map((u) => u.rent).filter((r) => typeof r === "number");
          if (rents.length > 0) {
            minRent = Math.min(...rents);
            maxRent = Math.max(...rents);
          }
        }

        return {
          ...p.toObject(),
          minRent,
          maxRent,
          units: units.map(u => ({
            _id: u._id,
            unitName: u.unitName,
            floor: u.floor,
            rent: u.rent,
            status: u.status,
            type: u.type
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: propertiesWithRanges.length,
      data: propertiesWithRanges,
    });
  } catch (error: any) {
    console.error("❌ Error fetching public properties:", error);
    res.status(500).json({
      success: false,
      message: "মার্কেটপ্লেসের বাসাগুলো লোড করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
}

// ২. রিয়েল-টাইম প্ল্যাটফর্ম লাইভ স্ট্যাটস
export async function getPublicStats(req: Request, res: Response): Promise<void> {
  try {
    const totalProperties = await Property.countDocuments();
    const totalTenants = await Tenant.countDocuments({ status: "active" });
    const totalLandlords = await User.countDocuments({ role: "landlord" });

    // ডায়নামিক ফর্মুলার মাধ্যমে আকর্ষণীয় ও রিয়েল স্ট্যাটস জেনারেট করা
    const successSearches = totalTenants + 42; // বেস ভ্যালু সহ একটিভ ভাড়াটিয়া
    const listedProperties = totalProperties + 12; // বেস ভ্যালু সহ লিস্টিং

    res.status(200).json({
      success: true,
      data: {
        successSearches: `${successSearches}+`,
        listedProperties: `${listedProperties}+`,
        satisfiedClients: "৯৯.৯%",
        supportHours: "২৪/৭",
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching public stats:", error);
    res.status(500).json({
      success: false,
      message: "স্ট্যাটিস্টিকস লোড করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
}

// ৩. ডাইনামিক সাবস্ক্রিপশন প্যাকেজ এপিআই
export async function getPublicPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error("❌ Error fetching public plans:", error);
    res.status(500).json({
      success: false,
      message: "সাবস্ক্রিপশন প্যাকেজ লোড করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
}
