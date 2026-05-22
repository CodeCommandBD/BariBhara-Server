import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Unit from "../models/unit.model.js";
import Property from "../models/property.model.js";
import User from "../models/user.model.js";
import { generateAgreementPDF } from "../services/agreement.service.js";
import cloudinary from "cloudinary";
// ১. নতুন ভাড়াটিয়া যোগ করা (Assign Tenant to a Unit)
export const addTenant = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const files = req.files;
        const photoUrl = files?.[0]?.path?.replace(/\\/g, "/") ?? "";
        const { unit, property, name, phone, nid, rentAmount, advanceAmount, leaseStart, leaseEnd } = req.body;
        // ক. ইউনিটটি আছে কি না চেক করা
        const targetUnit = await Unit.findById(unit);
        if (!targetUnit) {
            return res.status(404).json({ success: false, message: "ইউনিটটি খুঁজে পাওয়া যায়নি!" });
        }
        // খ. ইউনিটটি কি ইতোমধ্যে ভাড়া দেওয়া হয়েছে?
        if (targetUnit.status === "ভাড়া হয়েছে") {
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ২. একজন মালিকের সকল ভাড়াটিয়ার তালিকা (Pagination সহ)
export const getAllTenants = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 9);
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৩. একটি নির্দিষ্ট ইউনিটের বর্তমান ভাড়াটিয়া
export const getTenantByUnit = async (req, res) => {
    try {
        const unitId = req.params.unitId; // Express params সবসময় string হয়
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৪. ভাড়াটিয়ার তথ্য আপডেট করা
export const updateTenant = async (req, res) => {
    try {
        const id = req.params.id; // Express params সবসময় string হয়
        const ownerId = req.user.id;
        const files = req.files;
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
        const updateData = { ...req.body };
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৫. ভাড়াটিয়া সরানো (Vacate) — ইউনিট খালি হয়ে যাবে
export const vacateTenant = async (req, res) => {
    try {
        const id = req.params.id; // Express params সবসময় string হয়
        const ownerId = req.user.id;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৬. Auto Renew টগল করা
export const toggleAutoRenew = async (req, res) => {
    try {
        const id = req.params.id;
        const ownerId = req.user.id;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৭. ম্যানুয়াল রিনিউ (মেয়াদ বাড়ানো)
export const renewLease = async (req, res) => {
    try {
        const id = req.params.id;
        const ownerId = req.user.id;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ... existing code ...
// ৮. চুক্তিপত্র জেনারেট করা
export const generateAgreement = async (req, res) => {
    try {
        const id = req.params.id;
        const ownerId = req.user.id;
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
            propertyName: tenant.property?.name ?? "N/A",
            unitName: tenant.unit?.unitName ?? "N/A",
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৯. ভাড়াটিয়া কর্তৃক স্বাক্ষর করা (Sign Agreement)
export const signAgreement = async (req, res) => {
    try {
        const tenantId = req.user.id; // Tenant portal login
        const { signatureData } = req.body; // base64 image
        if (!signatureData) {
            return res.status(400).json({ success: false, message: "স্বাক্ষর প্রয়োজন!" });
        }
        const tenant = await Tenant.findById(tenantId);
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
        tenant.agreement = {
            ...(tenant.agreement || {}),
            signatureUrl: result.secure_url,
            isSigned: true,
            signedAt: new Date(),
        };
        await tenant.save();
        res.status(200).json({ success: true, message: "চুক্তিপত্র সফলভাবে স্বাক্ষরিত হয়েছে!" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ১০. চুক্তিপত্র মুছে ফেলা (Delete Agreement)
export const deleteAgreement = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant = await Tenant.findById(id);
        if (!tenant)
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
        tenant.agreement = {
            pdfUrl: null,
            signatureUrl: null,
            isSigned: false,
            signedAt: null,
        };
        await tenant.save();
        res.status(200).json({ success: true, message: "চুক্তিপত্র সফলভাবে মুছে ফেলা হয়েছে!" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=tenant.controller.js.map