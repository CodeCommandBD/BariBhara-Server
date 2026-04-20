import type { Request as Req, Response as Res } from "express";
import Property from "../models/property.model.js"; // প্রপার্টি মডেল ইমপোর্ট
import Unit from "../models/unit.model.js"; // ইউনিট মডেল ইমপোর্ট

// ড্যাশবোর্ডের সব পরিসংখ্যান (Stats) বের করার ফাংশন
export const getLandlordStats = async (req: Req, res: Res) => {
  try {
    // ১. পাসপোর্ট মিডলওয়্যার থেকে বর্তমানে লগইন করা ইউজারের আইডি নেওয়া
    const ownerId = (req as any).user.id;

    // ২. বর্তমান ইউজারের মোট কয়টি বিল্ডিং আছে তা ডাটাবেসে গণনা করা
    const totalProperties = await Property.countDocuments({ owner: ownerId });

    // ৩. ইউজারের সব বিল্ডিংগুলোর আইডি এর লিস্ট বের করা (যাতে ওই বিল্ডিংয়ের রুমগুলো খোঁজা যায়)
    const propertyIds = await Property.find({ owner: ownerId }).distinct("_id");

    // ৪. এই বিল্ডিংগুলোর আন্ডারে মোট কয়টি ইউনিট (রুম/ফ্ল্যাট) আছে তা গোনা
    const totalUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
    });

    // ৫. বর্তমানে কতটি ইউনিট ভাড়া দেওয়া হয়েছে তা গোনা (status: "ভাড়া হয়েছে")
    const rentedUnits = await Unit.countDocuments({
      property: { $in: propertyIds },
      status: "ভাড়া হয়েছে",
    });

    // ৬. খালি ইউনিটের সংখ্যা বের করা (মোট ইউনিট - ভাড়া দেওয়া ইউনিট)
    const availableUnits = totalUnits - rentedUnits;

    // ৭. মোট মাসিক আয় বের করা (যেগুলো ভাড়া হয়েছে সেগুলোর রেন্ট যোগ করা)
    // এটি MongoDB Aggregation ব্যবহার করে করা হচ্ছে

    const revenueData = await Unit.aggregate([
      // কন্ডিশন: শুধুমাত্র এই ইউজারের এবং যেগুলো ভাড়া হয়ে গেছে সেই ইউনিটগুলো নাও
      { $match: { property: { $in: propertyIds }, status: "ভাড়া হয়েছে" } },
      // গ্রুপ করো এবং সব ইউনিটের rent (ভাড়া) যোগ করো
      { $group: { _id: null, totalRevenue: { $sum: "$rent" } } },
    ]);

    // যদি কোনো ডাটা থাকে তবে তার যোগফল নাও, নাহলে ০ ধরো
    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // ৮. অকুপেন্সি রেট (কত শতাংশ ভাড়া হয়েছে) বের করা
    const occupancyRate =
      totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;

       // ৯. সব তথ্য একসাথে ফ্রন্টএন্ডে পাঠিয়ে দেওয়া
    res.status(200).json({
        success: true,
        stats: {
        totalProperties, // মোট বিল্ডিং
        totalUnits,      // মোট রুম
        rentedUnits,     // ভাড়া হওয়া রুম
        availableUnits,  // খালি রুম
        totalRevenue,    // মোট মাসিক আয়
        occupancyRate    // ভাড়ার হার (%)
        }
    })
    
  } catch (error: any) {
    // কোনো ভুল হলে এরর মেসেজ পাঠানো
    res.status(500).json({ success: false, message: error.message });
  }
};
