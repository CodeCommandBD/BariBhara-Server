import type { Request as Req, Response as Res } from "express";
import Unit from "../models/unit.model.js";
import Property from "../models/property.model.js";

// ৩. নতুন ইউনিট (Flat/Room) অ্যাড করা
export const createUnit = async (req: Req, res: Res) => {
  try {
    const { property, unitName, floor, type, rent, status, bedrooms, bathrooms, area } = req.body;
    const userId = (req as any).user.id;

    // ১. প্রথমে চেক করবো এই বাড়িটি কার?
    const targetProperty = await Property.findById(property);

    if (!targetProperty) {
      return res
        .status(404)
        .json({ success: false, message: "প্রপার্টি খুঁজে পাওয়া যায়নি!" });
    }

    // ২. চেক করবো এই বাড়িটি কি বর্তমান ইউজারের? (Security Check)
    if (targetProperty.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "আপনি এই প্রপার্টিতে ইউনিট যোগ করার অনুমতিপ্রাপ্ত নন!",
      });
    }

    // ৩. ছবি আপলোড হ্যান্ডলিং
    const files = req.files as Express.Multer.File[];
    const imageUrls = files && files.length > 0 ? files.map((file) => file.path.replace(/\\/g, "/")) : [];

    const newUnit = new Unit({
      property, // কোন বিল্ডিং-এর জন্য ইউনিট তৈরি হচ্ছে
      unitName,
      floor,
      type,
      rent,
      status,
      bedrooms: bedrooms ? Number(bedrooms) : 1,
      bathrooms: bathrooms ? Number(bathrooms) : 1,
      area: area ? Number(area) : 0,
      images: imageUrls,
    });

    await newUnit.save();
    res.status(201).json({
      success: true,
      message: "ইউনিট সফলভাবে যোগ করা হয়েছে!",
      unit: newUnit,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. একটি নির্দিষ্ট বাড়ির সব কয়টি ইউনিট দেখার ফাংশন
export const getUnitsByProperty = async (req: Req, res: Res) => {
  try {
    const { propertyId } = req.params;
    const units = await Unit.find({ property: propertyId as string }).populate("currentTenant");

    res.status(200).json({
      success: true,
      count: units.length,
      units,
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: "ইউনিট লোড করতে সমস্যা হয়েছে!" });
  }
};

// 5. ইউনিটের তথ্য আপডেট করার ফাংশন (Update Unit)
export const updateUnit = async (req: Req, res: Res) => {
  try {
    // ক. রিকোয়েস্ট প্যারামিটার (URL) থেকে ইউনিটের আইডিটি নিচ্ছি
    const { unitId } = req.params;

    // খ. বিদ্যমান ছবিগুলো (যেগুলো ডিলিট করা হয়নি)
    let existingImages = req.body.existingImages || [];
    if (typeof existingImages === "string") {
      existingImages = [existingImages];
    }

    // গ. নতুন আপলোড করা ছবিগুলো
    const files = req.files as Express.Multer.File[];
    const newImagePaths = files ? files.map((file) => file.path.replace(/\\/g, "/")) : [];

    // ঘ. আগের এবং নতুন ছবিগুলোকে একসাথে যোগ করা
    const finalImages = [...existingImages, ...newImagePaths];

    // ঙ. ডাটা আপডেট করা
    const updateData = { ...req.body };
    delete updateData.existingImages;
    if (updateData.bedrooms !== undefined) updateData.bedrooms = Number(updateData.bedrooms);
    if (updateData.bathrooms !== undefined) updateData.bathrooms = Number(updateData.bathrooms);
    if (updateData.area !== undefined) updateData.area = Number(updateData.area);

    const updatedUnit = await Unit.findByIdAndUpdate(
      unitId,
      { ...updateData, images: finalImages },
      {
        new: true,
        runValidators: true,
      }
    );

    // গ. যদি ওই আইডি দিয়ে কোনো ইউনিট খুঁজে না পাওয়া যায়
    if (!updatedUnit) {
      return res.status(404).json({
        success: false,
        message: "ইউনিটটি খুঁজে পাওয়া যায়নি!",
      });
    }

    // ঘ. সফলভাবে আপডেট হলে রেসপন্স পাঠানো
    res.status(200).json({
      success: true,
      message: "ইউনিটের তথ্য সফলভাবে আপডেট করা হয়েছে!",
      unit: updatedUnit,
    });
  } catch (error: any) {
    // ঙ. কোনো টেকনিক্যাল এরর হলে ইউজারকে জানানো
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
      error: error.message,
    });
  }
};

// ৬. ইউনিট ডিলিট করার ফাংশন (Delete Unit)
export const deleteUnit = async (req: Req, res: Res) => {
  try {
    // ক. ইউআরএল প্যারামিটার থেকে ইউনিটের আইডিটি নিচ্ছি
    const { unitId } = req.params;

    // খ. ডাটাবেস থেকে ওই আইডি অনুযায়ী ইউনিটটি খুঁজে বের করে ডিলিট করা
    const deletedUnit = await Unit.findByIdAndDelete(unitId);

    // গ. যদি ওই আইডি দিয়ে কোনো ইউনিট খুঁজে পাওয়া না যায়
    if (!deletedUnit) {
      return res.status(404).json({
        success: false,
        message: "ইউনিটটি খুঁজে পাওয়া যায়নি!",
      });
    }

    // ঘ. সফলভাবে ডিলিট হলে কনফার্মেশন মেসেজ পাঠানো
    res.status(200).json({
      success: true,
      message: "ইউনিটটি সফলভাবে মুছে ফেলা হয়েছে!",
    });
  } catch (error: any) {
    // ঙ. কোনো টেকনিক্যাল এরর হলে ইউজারকে জানানো
    res.status(500).json({
      success: false,
      message: "ইউনিটটি ডিলিট করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
};

