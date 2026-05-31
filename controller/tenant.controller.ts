import type { Request as Req, Response as Res } from "express";
import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Unit from "../models/unit.model.js";
import Property from "../models/property.model.js";
import User from "../models/user.model.js";
import { generateAgreementPDF } from "../services/agreement.service.js";
import cloudinary from "cloudinary";

// ১. নতুন ভাড়াটিয়া যোগ করা (Assign Tenant to a Unit)
export const addTenant = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;

    // ১. ইউজার সাবস্ক্রিপশন ও লিমিট সিকিউরিটি চেক
    const user = await User.findById(ownerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "ইউজার খুঁজে পাওয়া যায়নি!" });
    }

    if (user.role === "landlord" && user.subscriptionStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "আপনার ড্যাশবোর্ডটি বর্তমানে লকড রয়েছে! নতুন ভাড়াটিয়া যুক্ত করতে দয়া করে আগে সাবস্ক্রাইব করুন।",
      });
    }

    if (user.role === "landlord" && user.subscriptionPlan === "free") {
      const tenantCount = await Tenant.countDocuments({ owner: ownerId, status: "সক্রিয়" });
      if (tenantCount >= 2) {
        return res.status(403).json({
          success: false,
          message: "আপনার ফ্রি প্ল্যানের লিমিট শেষ! আরও ভাড়াটিয়া ম্যানেজ করতে দয়া করে প্রো প্ল্যানে আপগ্রেড করুন।",
        });
      }
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const photoUrl = files?.[0]?.path?.replace(/\\/g, "/") ?? "";

    const { unit, property, name, phone, nid, rentAmount, advanceAmount, leaseStart, leaseEnd } =
      req.body as {
        unit: string;
        property: string;
        name: string;
        phone: string;
        nid?: string;
        rentAmount: number;
        advanceAmount?: number;
        leaseStart: string;
        leaseEnd?: string;
      };

    // ক. ইউনিটটি আছে কি না চেক করা
    const targetUnit = await Unit.findById(unit);
    if (!targetUnit) {
      return res.status(404).json({ success: false, message: "ইউনিটটি খুঁজে পাওয়া যায়নি!" });
    }

    // খ. ইউনিটটি কি ইতোমধ্যে ভাড়া দেওয়া হয়েছে?
    if ((targetUnit.status as string) === "ভাড়া হয়েছে") {
      return res.status(400).json({ success: false, message: "এই ইউনিটে ইতোমধ্যে একজন ভাড়াটিয়া আছেন!" });
    }

    // গ. প্রপার্টির মালিক যাচাই করা
    const targetProperty = await Property.findById(property);
    if (!targetProperty) {
      return res.status(404).json({ success: false, message: "প্রপার্টি খুঁজে পাওয়া যায়নি!" });
    }
    if (String(targetProperty.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই প্রপার্টির মালিক নন!" });
    }

    // ঘ. নতুন ভাড়াটিয়া তৈরি করা
    const newTenant = new Tenant({
      unit: new mongoose.Types.ObjectId(unit),
      property: new mongoose.Types.ObjectId(property),
      owner: new mongoose.Types.ObjectId(ownerId),
      name,
      phone,
      nid: nid || "",
      photo: photoUrl,
      rentAmount: Number(rentAmount),
      advanceAmount: Number(advanceAmount) || 0,
      leaseStart: new Date(leaseStart),
      leaseEnd: leaseEnd ? new Date(leaseEnd) : undefined,
    });
    await newTenant.save();

    // ঙ. ইউনিটের স্ট্যাটাস "ভাড়া হয়েছে" করে দেওয়া এবং ভাড়াটিয়ার রেফারেন্স যোগ করা
    await Unit.findByIdAndUpdate(unit, {
      status: "ভাড়া হয়েছে",
      currentTenant: newTenant._id,
    });

    res.status(201).json({
      success: true,
      message: `${name} সফলভাবে ভাড়াটিয়া হিসেবে যোগ করা হয়েছে!`,
      tenant: newTenant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. একজন মালিকের সকল ভাড়াটিয়ার তালিকা (Pagination সহ)
export const getAllTenants = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id as string;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 9);
    const skip = (page - 1) * limit;

    const filter = {
      owner: new mongoose.Types.ObjectId(ownerId),
      status: "সক্রিয়",
    };

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .populate("unit", "unitName floor type rent")
        .populate("property", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Tenant.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: tenants.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      tenants,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ৩. একটি নির্দিষ্ট ইউনিটের বর্তমান ভাড়াটিয়া
export const getTenantByUnit = async (req: Req, res: Res) => {
  try {
    const unitId = req.params.unitId as string; // Express params সবসময় string হয়

    if (!unitId || !mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ success: false, message: "অবৈধ ইউনিট আইডি!" });
    }

    const tenant = await Tenant.findOne({
      unit: new mongoose.Types.ObjectId(unitId),
      status: "সক্রিয়",
    })
      .populate("unit", "unitName floor type rent")
      .populate("property", "name location");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "এই ইউনিটে কোনো সক্রিয় ভাড়াটিয়া নেই!" });
    }

    res.status(200).json({ success: true, tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. ভাড়াটিয়ার তথ্য আপডেট করা
export const updateTenant = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string; // Express params সবসময় string হয়
    const ownerId = (req as any).user.id as string;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনি এই ভাড়াটিয়ার তথ্য পরিবর্তন করার অনুমতিপ্রাপ্ত নন!" });
    }

    const updateData: Record<string, any> = { ...req.body };

    // নতুন ছবি আপলোড হলে সেটি আপডেট করা
    if (files && files.length > 0) {
      updateData.photo = files?.[0]?.path?.replace(/\\/g, "/") ?? "";
    }

    const updatedTenant = await Tenant.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "ভাড়াটিয়ার তথ্য সফলভাবে আপডেট করা হয়েছে!",
      tenant: updatedTenant,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. ভাড়াটিয়া সরানো (Vacate) — ইউনিট খালি হয়ে যাবে
export const vacateTenant = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string; // Express params সবসময় string হয়
    const ownerId = (req as any).user.id as string;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই অপারেশনের অনুমতি নেই!" });
    }

    // ক. ভাড়াটিয়ার স্ট্যাটাস "চলে গেছে" করা
    await Tenant.findByIdAndUpdate(id, { status: "চলে গেছে" });

    // খ. ইউনিটের স্ট্যাটাস "খালি" করা এবং ভাড়াটিয়ার রেফারেন্স মুছে দেওয়া
    await Unit.findByIdAndUpdate(tenant.unit, {
      status: "খালি",
      $unset: { currentTenant: 1 },
    });

    res.status(200).json({
      success: true,
      message: `${tenant.name} ইউনিট ছেড়ে গেছেন। ইউনিটটি এখন খালি।`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৬. Auto Renew টগল করা
export const toggleAutoRenew = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string;
    const ownerId = (req as any).user.id as string;
    const { autoRenew } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই অপারেশনের অনুমতি নেই!" });
    }

    tenant.autoRenew = autoRenew;
    await tenant.save();

    res.status(200).json({
      success: true,
      message: `অটো-রিনিউয়াল ${autoRenew ? 'চালু' : 'বন্ধ'} করা হয়েছে`,
      autoRenew: tenant.autoRenew
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৭. ম্যানুয়াল রিনিউ (মেয়াদ বাড়ানো)
export const renewLease = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string;
    const ownerId = (req as any).user.id as string;
    const { newEndDate } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "অবৈধ আইডি!" });
    }

    if (!newEndDate) {
      return res.status(400).json({ success: false, message: "নতুন মেয়াদ শেষ হওয়ার তারিখ প্রয়োজন!" });
    }

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner) !== ownerId) {
      return res.status(403).json({ success: false, message: "আপনার এই অপারেশনের অনুমতি নেই!" });
    }

    tenant.leaseEnd = new Date(newEndDate);
    await tenant.save();

    res.status(200).json({
      success: true,
      message: "লিজ সফলভাবে রিনিউ করা হয়েছে!",
      leaseEnd: tenant.leaseEnd
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ... existing code ...

// ৮. চুক্তিপত্র জেনারেট করা
export const generateAgreement = async (req: Req, res: Res) => {
  try {
    const id = req.params.id as string;
    const ownerId = (req as any).user.id as string;

    const tenant = await Tenant.findById(id)
      .populate("unit", "unitName")
      .populate("property", "name")
      .populate("owner", "fullName");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (String(tenant.owner._id) !== ownerId) {
      return res.status(403).json({ success: false, message: "অনুমতি নেই!" });
    }

    const user = await User.findById(ownerId);

    const pdfUrl = await generateAgreementPDF({
      tenantName: tenant.name,
      propertyName: (tenant.property as any)?.name ?? "N/A",
      unitName: (tenant.unit as any)?.unitName ?? "N/A",
      rentAmount: tenant.rentAmount,
      startDate: tenant.leaseStart,
      endDate: tenant.leaseEnd || "Auto-renew",
      landlordName: user?.fullName ?? "মালিক",
    }, user?.agreementTemplate || "");

    tenant.agreement = {
      ...(tenant.agreement || {}),
      pdfUrl: pdfUrl,
      isSigned: false,
    };
    await tenant.save();

    res.status(200).json({ success: true, message: "চুক্তিপত্র সফলভাবে জেনারেট হয়েছে!", pdfUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৯. ভাড়াটিয়া কর্তৃক স্বাক্ষর করা (Sign Agreement)
export const signAgreement = async (req: Req, res: Res) => {
  try {
    const tenantId = (req as any).user.id as string; // Tenant portal login
    const { signatureData } = req.body; // base64 image

    if (!signatureData) {
      return res.status(400).json({ success: false, message: "স্বাক্ষর প্রয়োজন!" });
    }

    const tenant = await Tenant.findById(tenantId)
      .populate("unit", "unitName")
      .populate("property", "name")
      .populate("owner", "fullName agreementTemplate");

    if (!tenant) {
      return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
    }

    if (!tenant.agreement?.pdfUrl) {
      return res.status(400).json({ success: false, message: "আগে চুক্তিপত্র জেনারেট করতে হবে!" });
    }

    // Upload signature to cloudinary
    const result = await cloudinary.v2.uploader.upload(signatureData, {
      folder: "signatures",
    });

    // dynamic PDF regeneration with signature image
    const updatedPdfUrl = await generateAgreementPDF(
      {
        tenantName: tenant.name,
        propertyName: (tenant.property as any)?.name ?? "N/A",
        unitName: (tenant.unit as any)?.unitName ?? "N/A",
        rentAmount: tenant.rentAmount,
        startDate: tenant.leaseStart,
        endDate: tenant.leaseEnd || "Auto-renew",
        landlordName: (tenant.owner as any)?.fullName ?? "মালিক",
      },
      (tenant.owner as any)?.agreementTemplate || "",
      result.secure_url
    );

    tenant.agreement = {
      pdfUrl: updatedPdfUrl,
      signatureUrl: result.secure_url,
      isSigned: true,
      signedAt: new Date(),
    };
    await tenant.save();

    res.status(200).json({ success: true, message: "চুক্তিপত্র সফলভাবে স্বাক্ষরিত হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ১০. চুক্তিপত্র মুছে ফেলা (Delete Agreement)
export const deleteAgreement = async (req: Req, res: Res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    tenant.agreement = {
      pdfUrl: null,
      signatureUrl: null,
      isSigned: false,
      signedAt: null,
    };
    await tenant.save();

    res.status(200).json({ success: true, message: "চুক্তিপত্র সফলভাবে মুছে ফেলা হয়েছে!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ১১. NID Verification (Landlord)
export const verifyTenantNID = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "অবাধ্য স্ট্যাটাস!" });
    }

    const tenant = await Tenant.findOne({ _id: id, owner: ownerId });
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    if (!tenant.nidVerification) {
      tenant.nidVerification = {} as any;
    }

    tenant.nidVerification!.status = status;
    if (status === "verified") {
      tenant.nidVerification!.verifiedAt = new Date();
      tenant.nidVerification!.rejectionReason = undefined as any;
    } else {
      tenant.nidVerification!.rejectionReason = rejectionReason;
    }

    await tenant.save();

    res.status(200).json({ success: true, message: `NID ${status === "verified" ? "অনুমোদিত" : "বাতিল"} হয়েছে!`, tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ১২. ইউটিলিটি কনফিগারেশন আপডেট করা (Landlord)
export const updateTenantUtilities = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { id } = req.params;
    const { utilityConfig } = req.body;

    if (!utilityConfig) {
      return res.status(400).json({ success: false, message: "ইউটিলিটি ডেটা প্রদান করা হয়নি!" });
    }

    const tenant = await Tenant.findOne({ _id: id, owner: ownerId });
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    tenant.utilityConfig = utilityConfig;

    await tenant.save();

    res.status(200).json({ success: true, message: "ইউটিলিটি সেটিংস সফলভাবে সেভ করা হয়েছে!", tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ১৩. ভাড়াটিয়ার রেটিং আপডেট করা
export const rateTenant = async (req: Req, res: Res) => {
  try {
    const ownerId = (req as any).user.id;
    const { id } = req.params;
    const { behavior, payment, cleanliness, review } = req.body;

    if (behavior === undefined || payment === undefined || cleanliness === undefined) {
      return res.status(400).json({ success: false, message: "সকল ক্যাটাগরির রেটিং প্রদান করা আবশ্যক!" });
    }

    const tenant = await Tenant.findOne({ _id: id, owner: ownerId });
    if (!tenant) return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });

    const behaviorScore = Number(behavior);
    const paymentScore = Number(payment);
    const cleanlinessScore = Number(cleanliness);

    if (
      behaviorScore < 0 || behaviorScore > 5 ||
      paymentScore < 0 || paymentScore > 5 ||
      cleanlinessScore < 0 || cleanlinessScore > 5
    ) {
      return res.status(400).json({ success: false, message: "রেটিং 0 থেকে 5 এর মধ্যে হতে হবে।" });
    }

    const overallScore = Math.round(((behaviorScore + paymentScore + cleanlinessScore) / 3) * 10) / 10;

    tenant.rating = {
      behavior: behaviorScore,
      payment: paymentScore,
      cleanliness: cleanlinessScore,
      overall: overallScore,
      review: review || "",
      updatedAt: new Date(),
    };

    await tenant.save();

    res.status(200).json({ success: true, message: "রেটিং সফলভাবে আপডেট করা হয়েছে!", tenant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
