import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Property from "../models/property.model.js";
import Unit from "../models/unit.model.js";


// ১. নতুন বাড়ি তৈরি করা (Create Property)

export const createProperty = async (req: Req, res: Res) => {
  try {
    // req.body থেকে ডেটা নেওয়া
    const { name, location, totalFloors } = req.body;

    // ছবিগুলো সার্ভারে আপলোড হওয়ার পর তার লিঙ্কগুলো req.files-এ পাওয়া যাবে
    // req.files থেকে ছবি নেওয়া
    const files = req.files as Express.Multer.File[];
    const imageUrls =
      files && files.length > 0 ? files.map((file) => file.path.replace(/\\/g, "/")) : []; // স্ল্যাশ ফিক্স করা হলো

    // নতুন প্রপার্টি তৈরি করা
    const property = new Property({
      name,
      location,
      totalFloors,
      images: imageUrls,
      owner: (req as any).user.id, // যদি ইউজার লগইন করা থাকে
    });

    // প্রপার্টি সেভ করা
    await property.save();

    // রেসপন্স পাঠানো
    res.status(201).json({
      success: true,
      message: "প্রপার্টি সফলভাবে তৈরি করা হয়েছে!",
      data: property,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "প্রপার্টি তৈরি করা সম্ভব হয়নি!",
      error: error.message,
    });
  }
};

// ২. বাড়িওয়ালার নিজের সব বাড়ির লিস্ট দেখা (Get Landlord's Properties)

export const getMyProperties = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id; // login করা ইউজারের আইডি
    const properties = await Property.find({ owner: ownerId }); // property model থেকে owner id দিয়ে search করা

    res.status(200).json({
      success: true,
      count: properties.length,
      properties,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "প্রপার্টি খুঁজে পাওয়া যায়নি!",
      error: error.message,
    });
  }
};

// ৩. একটি নির্দিষ্ট বাড়ির বিস্তারিত তথ্য দেখা (Get Single Property Detail)

export const getPropertyDetail = async (req: Req, res: Res) => {
  try {
    const { id } = req.params; // url থেকে id নেওয়া
    const ownerId = (req as any).user.id; // login করা ইউজারের আইডি

    // আইডি দিয়ে বাড়িটি খুঁজে বের করা এবং চেক করা এটি এই ইউজারের কি না
    const property = await Property.findById(id); 

    // যদি প্রপার্টি খুঁজে না পাওয়া যায়
    if(!property){
        return res.status(404).json({
            success: false,
            message: "প্রপার্টি খুঁজে পাওয়া যায়নি!",
        });
    }
    // যদি প্রপার্টি খুঁজে পাওয়া যায় তাহলে রেসপন্স পাঠানো
    res.status(200).json({
        success: true,
        property,
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
        success: false,
        message: "প্রপার্টি খুঁজে পাওয়া যায়নি!",
        error: error.message,
    });
  }
};

// ৪. প্রপার্টির তথ্য আপডেট করা (Update Property Detail)
export const updateProperty = async (req: Req, res: Res) => {
  try {
    const { id } = req.params;
    const ownerId = (req as any).user.id;

    const property = await Property.findOne({ _id: id, owner: ownerId });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "প্রপার্টি খুঁজে পাওয়া যায়নি!",
      });
    }

    // ক. ফ্রন্টএন্ড থেকে আসা আগের ছবির লিস্ট (যা ইউজার ডিলিট করেননি)
    let existingImages = req.body.existingImages || [];
    
    // যদি ফ্রন্টএন্ড থেকে একটি মাত্র ছবি স্ট্রিং আকারে আসে, তাকে অ্যারেতে রূপান্তর করা
    if (typeof existingImages === "string") {
      existingImages = [existingImages];
    }

    // খ. নতুন আপলোড করা ছবিগুলো নেওয়া
    const files = req.files as Express.Multer.File[];
    const newImagePaths = files ? files.map((file) => file.path.replace(/\\/g, "/")) : []; // স্ল্যাশ ফিক্স করা হলো

    // গ. আগের এবং নতুন ছবিগুলোকে একসাথে যোগ করা
    const finalImages = [...existingImages, ...newImagePaths];

    // ঘ. ডাটাবেস আপডেট করা
    const updateData = { ...req.body };
    delete updateData.existingImages; // এটি ডাটাবেসে সেভ করার দরকার নেই

    const updatedProperty = await Property.findByIdAndUpdate(
      id,
      {
        ...updateData,
        images: finalImages,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "প্রপার্টি সফলভাবে আপডেট করা হয়েছে!",
      property: updatedProperty,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "আপডেট করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
};

// ৫. প্রপার্টি ডিলিট করা (Delete Property & Associated Data)
export const deleteProperty = async (req: Req, res: Res) => {
  try {
    const { id } = req.params;
    const ownerId = (req as any).user.id;

    // ক. মালিকানা যাচাই করা
    const property = await Property.findOne({ _id: id, owner: ownerId });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "প্রপার্টি খুঁজে পাওয়া যায়নি!",
      });
    }

    // খ. এই বাড়ির সব ইউনিট ডিলিট করা
    if (id) {
      await Unit.deleteMany({ property: id as string });
    }

    // গ. প্রপার্টি ডিলিট করা
    await Property.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "প্রপার্টি সফলভাবে মুছে ফেলা হয়েছে!",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "ডিলিট করতে সমস্যা হয়েছে!",
      error: error.message,
    });
  }
};