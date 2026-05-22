import mongoose from "mongoose";
import Tenant from "../models/tenant.model.js";
import Invoice from "../models/invoice.model.js";
import { clearDashboardCache } from "./dashboard.controller.js";
const MONTH_NAMES = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
];
// ১. প্রপার্টির সকল সক্রিয় ভাড়াটিয়ার তালিকা (Bulk Invoice তৈরির জন্য)
export const getTenantsForBulk = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
        const { propertyId } = req.query;
        const filter = { owner: ownerObjectId, status: "সক্রিয়" };
        if (propertyId && mongoose.Types.ObjectId.isValid(propertyId)) {
            filter.property = new mongoose.Types.ObjectId(propertyId);
        }
        const tenants = await Tenant.find(filter)
            .populate("property", "name")
            .populate("unit", "unitName")
            .select("name phone rentAmount property unit leaseStart");
        res.status(200).json({ success: true, tenants });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ২. বাল্ক ইনভয়েস জেনারেট
export const generateBulkInvoices = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
        const { tenantIds, month, year, waterBill = 0, gasBill = 0, electricityBill = 0, serviceCharge = 0 } = req.body;
        if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
            return res.status(400).json({ success: false, message: "ভাড়াটিয়ার তালিকা আবশ্যক" });
        }
        if (!month || !year) {
            return res.status(400).json({ success: false, message: "মাস এবং বছর আবশ্যক" });
        }
        // সব ভাড়াটিয়ার তথ্য আনো
        const tenants = await Tenant.find({
            _id: { $in: tenantIds.map((id) => new mongoose.Types.ObjectId(id)) },
            owner: ownerObjectId,
            status: "সক্রিয়",
        });
        const results = { created: 0, skipped: 0, errors: [] };
        for (const tenant of tenants) {
            try {
                const extras = Number(waterBill) + Number(gasBill) + Number(electricityBill) + Number(serviceCharge);
                const totalAmount = tenant.rentAmount + extras;
                await Invoice.create({
                    tenant: tenant._id,
                    unit: tenant.unit,
                    property: tenant.property,
                    owner: ownerObjectId,
                    month,
                    year: Number(year),
                    baseRent: tenant.rentAmount,
                    waterBill: Number(waterBill),
                    gasBill: Number(gasBill),
                    electricityBill: Number(electricityBill),
                    serviceCharge: Number(serviceCharge),
                    otherBill: 0,
                    totalAmount,
                    paidAmount: 0,
                    dueAmount: totalAmount,
                    status: "Unpaid",
                    dueDate: new Date(Number(year), MONTH_NAMES.indexOf(month) + 1, 5),
                });
                results.created++;
            }
            catch (err) {
                // duplicate key — ইতিমধ্যে এই মাসের বিল আছে
                if (err.code === 11000) {
                    results.skipped++;
                }
                else {
                    results.errors.push(`${tenant.name}: ${err.message}`);
                }
            }
        }
        // ড্যাশবোর্ড ক্যাশ ক্লিয়ার করা
        clearDashboardCache(ownerId);
        res.status(200).json({
            success: true,
            message: `${results.created}টি বিল তৈরি হয়েছে, ${results.skipped}টি ইতিমধ্যে ছিল।`,
            results,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৩. Lease Auto-renewal toggle (tenant level)
export const toggleAutoRenewal = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { tenantId } = req.params;
        const { autoRenew, renewalMonths } = req.body;
        const tenant = await Tenant.findOneAndUpdate({ _id: tenantId, owner: ownerId }, { autoRenew, renewalMonths: renewalMonths ?? 12 }, { new: true });
        if (!tenant)
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });
        res.status(200).json({ success: true, message: "লিজ নবায়ন সেটিং আপডেট হয়েছে", tenant });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৪. Manual lease renewal
export const manualRenewLease = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { tenantId } = req.params;
        const { months = 12 } = req.body;
        const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId });
        if (!tenant)
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি" });
        const currentEnd = tenant.leaseEnd ? new Date(tenant.leaseEnd) : new Date();
        const newEnd = new Date(currentEnd);
        newEnd.setMonth(newEnd.getMonth() + Number(months));
        tenant.leaseEnd = newEnd;
        await tenant.save();
        // ক্যাশ ক্লিয়ার করা (Expiry alert update এর জন্য)
        clearDashboardCache(ownerId);
        res.status(200).json({ success: true, message: `লিজ ${months} মাস বাড়ানো হয়েছে`, newLeaseEnd: newEnd });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ৫. Lease expiry warning list (৩০ দিনের মধ্যে শেষ হবে)
export const getExpiringLeases = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        const tenants = await Tenant.find({
            owner: ownerObjectId,
            status: "সক্রিয়",
            leaseEnd: { $gte: now, $lte: in30Days },
        })
            .populate("property", "name")
            .populate("unit", "unitName")
            .select("name phone leaseEnd autoRenew property unit");
        res.status(200).json({ success: true, tenants, count: tenants.length });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
//# sourceMappingURL=bulk.controller.js.map