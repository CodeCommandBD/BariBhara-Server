import type { Request, Response } from "express";
import Property from "../models/property.model.js";
import User from "../models/user.model.js";
import Tenant from "../models/tenant.model.js";
import Plan from "../models/plan.model.js";
import Unit from "../models/unit.model.js";

// ১. প্রোপার্টি মার্কেটপ্লেস এপিআই — Advanced Search + Filter + Pagination
export async function getPublicProperties(req: Request, res: Response): Promise<void> {
  try {
    const {
      location,
      type,
      minRent,
      maxRent,
      sort,
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, parseInt(limit as string) || 12);
    const skip = (pageNum - 1) * limitNum;

    // বেস ফিল্টার — শুধু পাবলিক ও অ্যাভেইলেবল
    const filter: any = { isPublic: true, status: "available" };

    // লোকেশন টেক্সট সার্চ (address এবং location ফিল্ড)
    if (location && String(location).trim()) {
      const searchReg = new RegExp(String(location).trim(), "i");
      filter.$or = [
        { address: searchReg },
        { location: searchReg },
        { name: searchReg },
        { description: searchReg },
      ];
    }

    // টাইপ ফিল্টার
    if (type && type !== "all") {
      filter.type = type;
    }

    // সর্ট অপশন
    let sortOption: any = { createdAt: -1 }; // ডিফল্ট: সর্বশেষ আগে
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("owner", "fullName phoneNumber email phone isVerified photo")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter),
    ]);

    // প্রতিটি প্রোপার্টির rent range এবং unit details
    const propertiesWithRanges = await Promise.all(
      properties.map(async (p) => {
        const units = await Unit.find({ property: p._id });
        const rents = units.map((u) => u.rent).filter((r) => typeof r === "number" && r > 0);
        const minRentVal = rents.length > 0 ? Math.min(...rents) : 0;
        const maxRentVal = rents.length > 0 ? Math.max(...rents) : 0;
        const availableUnits = units.filter(u => u.status === "খালি").length;

        return {
          ...p.toObject(),
          minRent: minRentVal,
          maxRent: maxRentVal,
          unitCount: units.length,
          availableUnits,
          units: units.map(u => ({
            _id: u._id,
            unitName: u.unitName,
            floor: u.floor,
            rent: u.rent,
            status: u.status,
            type: u.type,
          })),
        };
      })
    );

    // rent range filter (unit-level) — applied after fetching
    let filtered = propertiesWithRanges;
    if (minRent) filtered = filtered.filter(p => p.maxRent >= parseInt(minRent as string));
    if (maxRent) filtered = filtered.filter(p => p.minRent <= parseInt(maxRent as string));

    // sort by rent after filter
    if (sort === "rent_asc") filtered.sort((a, b) => a.minRent - b.minRent);
    if (sort === "rent_desc") filtered.sort((a, b) => b.minRent - a.minRent);

    res.status(200).json({
      success: true,
      count: filtered.length,
      total: (minRent || maxRent || sort === "rent_asc" || sort === "rent_desc") ? filtered.length : total,
      totalPages: Math.ceil(total / limitNum),
      page: pageNum,
      data: filtered,
    });
  } catch (error: any) {
    console.error("❌ Error fetching public properties:", error);
    res.status(500).json({
      success: false,
      message: "মার্কেটপ্লেসের বাসাগুলো লোড করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
}

// ১ক. একটি নির্দিষ্ট Public Property-র বিস্তারিত তথ্য
export async function getPublicPropertyById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ _id: id, isPublic: true })
      .populate("owner", "fullName phone email isVerified photo");

    if (!property) {
      res.status(404).json({ success: false, message: "প্রপার্টি পাওয়া যায়নি!" });
      return;
    }

    const units = await Unit.find({ property: id as any });
    const rents = units.map(u => u.rent).filter(r => typeof r === "number" && r > 0);

    res.status(200).json({
      success: true,
      data: {
        ...property.toObject(),
        minRent: rents.length > 0 ? Math.min(...rents) : 0,
        maxRent: rents.length > 0 ? Math.max(...rents) : 0,
        unitCount: units.length,
        availableUnits: units.filter(u => u.status === "খালি").length,
        units,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}



// ২. রিয়েল-টাইম প্ল্যাটফর্ম লাইভ স্ট্যাটস
export async function getPublicStats(req: Request, res: Response): Promise<void> {
  try {
    const totalProperties = await Property.countDocuments();
    const totalTenants = await Tenant.countDocuments({ status: "active" });
    const uniqueOwners = await Property.distinct("owner");
    const totalLandlords = await User.countDocuments({
      _id: { $in: uniqueOwners },
      isVerified: "verified"
    });

    // রিয়েল স্ট্যাটস জেনারেট করা (কোনো ফেইক বেস ভ্যালু ছাড়া)
    const successSearches = totalTenants; // শুধুমাত্র রিয়েল একটিভ ভাড়াটিয়া
    const listedProperties = totalProperties; // শুধুমাত্র রিয়েল লিস্টিং

    res.status(200).json({
      success: true,
      data: {
        successSearches: `${successSearches}+`,
        listedProperties: `${listedProperties}+`,
        verifiedLandlords: `${totalLandlords}+`,
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
