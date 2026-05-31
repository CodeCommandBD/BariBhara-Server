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

    // আমরা এখন Properties এর বদলে সরাসরি Units ফেচ করবো
    const unitFilter: any = { status: { $in: ["খালি", "available"] } };

    // টাইপ ফিল্টার
    if (type && type !== "all") {
      unitFilter.type = type;
    }

    // রেট ফিল্টার
    if (minRent) unitFilter.rent = { ...unitFilter.rent, $gte: parseInt(minRent as string) };
    if (maxRent) unitFilter.rent = { ...unitFilter.rent, $lte: parseInt(maxRent as string) };

    let unitSortOption: any = { createdAt: -1 };
    if (sort === "oldest") unitSortOption = { createdAt: 1 };
    if (sort === "rent_asc") unitSortOption = { rent: 1 };
    if (sort === "rent_desc") unitSortOption = { rent: -1 };

    // ১. প্রথমে সব খালি ইউনিট ফেচ করি (যাদের প্যারেন্ট প্রপার্টি পাবলিক)
    const units = await Unit.find(unitFilter)
      .populate({
        path: "property",
        match: { isPublic: true }, // শুধুমাত্র পাবলিশ করা প্রপার্টির ইউনিট
        populate: {
          path: "owner",
          select: "fullName phoneNumber email phone isVerified photo landlordRating",
        },
      })
      .sort(unitSortOption);

    // ২. যেসব ইউনিটের প্রপার্টি পাবলিশ করা নেই, সেগুলো বাদ দেওয়া
    let validUnits = units.filter((u: any) => u.property !== null);

    // ৩. লোকেশন টেক্সট সার্চ (address এবং location ফিল্ড প্রপার্টিতে আছে)
    if (location && String(location).trim()) {
      const searchReg = new RegExp(String(location).trim(), "i");
      validUnits = validUnits.filter((u: any) => {
        const p = u.property;
        return (
          searchReg.test(p.address || "") ||
          searchReg.test(p.location || "") ||
          searchReg.test(p.name || "") ||
          searchReg.test(p.description || "")
        );
      });
    }

    const totalValidUnits = validUnits.length;
    
    // ৪. পেজিনেশন অ্যাপ্লাই করা
    const paginatedUnits = validUnits.slice(skip, skip + limitNum);

    // ৫. ফ্রন্টএন্ডের জন্য ডেটা ফরম্যাট করা
    const formattedUnits = paginatedUnits.map((u: any) => {
      const p = u.property;
      return {
        _id: u._id,
        unitName: u.unitName,
        rent: u.rent,
        floor: u.floor,
        type: u.type,
        bedrooms: u.bedrooms || p.bedrooms || 1,
        bathrooms: u.bathrooms || p.bathrooms || 1,
        area: u.area || p.area || 0,
        images: u.images && u.images.length > 0 ? u.images : p.images, // ইউনিটের ছবি না থাকলে প্রপার্টির ছবি
        propertyId: p._id,
        propertyName: p.name,
        location: p.location,
        address: p.address,
        description: p.description,
        contactNumber: p.contactNumber,
        owner: p.owner,
        isVerified: p.owner?.isVerified === "verified",
      };
    });

    res.status(200).json({
      success: true,
      count: formattedUnits.length,
      total: totalValidUnits,
      totalPages: Math.ceil(totalValidUnits / limitNum),
      page: pageNum,
      data: formattedUnits,
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
      .populate("owner", "fullName phone email isVerified photo landlordRating");

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
