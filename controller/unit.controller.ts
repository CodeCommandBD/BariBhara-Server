import type { Request as Req, Response as Res } from "express";
import Unit from "../models/unit.model.js";
import Property from "../models/property.model.js";

// ৩. নতুন ইউনিট (Flat/Room) অ্যাড করা
export const createUnit = async (req: Req, res: Res) => {
  try {
    const { property, unitName, floor, type, rent, status } = req.body;
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

    const newUnit = new Unit({
      property, // কোন বিল্ডিং-এর জন্য ইউনিট তৈরি হচ্ছে
      unitName,
      floor,
      type,
      rent,
      status,
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

// একটি নির্দিষ্ট বাড়ির সব কয়টি ইউনিট দেখার ফাংশন
export const getUnitsByProperty = async (req: Req, res: Res) => {
  try {
    const { propertyId } = req.params;
    const units = await Unit.find({ property: propertyId  as string});

    res.status(200).json({
      success: true,
      count: units.length,
      units,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "ইউনিট লোড করতে সমস্যা হয়েছে!" });
  }
};
