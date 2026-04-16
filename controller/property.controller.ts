import type { Request as Req, Response as Res } from "express";
import Property from "../models/property.model.js";

// ১. নতুন বাড়ি তৈরি করা (Create Property)
export const createProperty = async (req: Req, res: Res) => {
  try {
    const { name, location, totalFloors } = req.body;

    // ছবিগুলো Cloudinary-তে আপলোড হওয়ার পর তার লিঙ্কগুলো req.files-এ পাওয়া যাবে
    const files = req.files as Express.Multer.File[];
    const imageUrls = (files && files.length > 0) 
      ? files.map((file) => file.path) 
      : [];

    const newProperty = new Property({
      name,
      location,
      totalFloors,
      images: imageUrls,
      owner: (req as any).user.id, // পাসপোর্ট মিডলওয়্যার থেকে পাওয়া লগইন করা ইউজার
    });
    await newProperty.save();
    res.status(201).json({
      success: true,
      message: "প্রপার্টি সফলভাবে তৈরি করা হয়েছে!",
      property: newProperty,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ২. বাড়িওয়ালার নিজের সব বাড়ির লিস্ট দেখা

export const getMyProperties = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const properties = await Property.find({ owner: ownerId });
    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
