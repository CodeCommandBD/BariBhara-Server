import jwt from "jsonwebtoken";
import Tenant from "../models/tenant.model.js";
import Invoice from "../models/invoice.model.js";
import Maintenance from "../models/maintenance.model.js";
import { generateInvoicePDF, generateInvoiceNumber } from "../services/pdf.service.js";
import { sendNotification } from "../services/socket.service.js";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES = "7d";
// ============================================================
// ১. Tenant Login (phone বা email দিয়ে)
// ============================================================
export const tenantLogin = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier = phone বা email
        if (!identifier || !password) {
            return res.status(400).json({ success: false, message: "ফোন/ইমেইল এবং পাসওয়ার্ড দিন!" });
        }
        // phone বা email দিয়ে খোঁজা
        const tenant = await Tenant.findOne({
            $or: [{ phone: identifier }, { email: identifier }],
            portalEnabled: true,
        }).select("+portalPassword");
        if (!tenant) {
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি বা পোর্টাল এনাবল নেই!" });
        }
        const isMatch = await tenant.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "পাসওয়ার্ড ভুল!" });
        }
        const token = jwt.sign({ id: tenant._id, role: "tenant" }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        res.json({
            success: true,
            message: "লগইন সফল!",
            token: `Bearer ${token}`,
            tenant: {
                _id: tenant._id,
                name: tenant.name,
                phone: tenant.phone,
                email: tenant.email,
                photo: tenant.photo,
                property: tenant.property,
                unit: tenant.unit,
            },
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ২. Tenant Dashboard — নিজের সব তথ্য
// ============================================================
export const getTenantDashboard = async (req, res) => {
    try {
        const tenantId = req.user.id;
        const tenant = await Tenant.findById(tenantId)
            .populate("property", "name address")
            .populate("unit", "unitName floor type");
        if (!tenant) {
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া খুঁজে পাওয়া যায়নি!" });
        }
        // সর্বশেষ ৩টি invoice
        const recentInvoices = await Invoice.find({ tenant: tenantId })
            .sort({ createdAt: -1 })
            .limit(3)
            .select("month year totalAmount paidAmount dueAmount status");
        // বকেয়া হিসাব
        const allInvoices = await Invoice.find({ tenant: tenantId });
        const totalDue = allInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
        const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        // চলমান maintenance requests
        const activeMaintenance = await Maintenance.find({
            tenant: tenantId,
            status: { $in: ["Pending", "In Progress"] },
        }).select("title status priority createdAt");
        res.json({
            success: true,
            tenant,
            stats: {
                totalDue,
                totalPaid,
                totalInvoices: allInvoices.length,
                activeMaintenance: activeMaintenance.length,
            },
            recentInvoices,
            activeMaintenance,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ৩. Tenant-এর সব Invoice দেখা
// ============================================================
export const getTenantInvoices = async (req, res) => {
    try {
        const tenantId = req.user.id;
        const { status, year } = req.query;
        const filter = { tenant: tenantId };
        if (status)
            filter.status = status;
        if (year)
            filter.year = Number(year);
        const invoices = await Invoice.find(filter)
            .sort({ year: -1, createdAt: -1 })
            .populate("property", "name")
            .populate("unit", "unitName");
        res.json({ success: true, invoices });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ৪. Tenant Invoice PDF Download
// ============================================================
export const downloadTenantInvoicePDF = async (req, res) => {
    try {
        const tenantId = req.user.id;
        const { invoiceId } = req.params;
        const invoice = await Invoice.findOne({ _id: invoiceId, tenant: tenantId })
            .populate("tenant", "name phone")
            .populate("property", "name")
            .populate("unit", "unitName");
        if (!invoice) {
            return res.status(404).json({ success: false, message: "ইনভয়েস পাওয়া যায়নি!" });
        }
        const tenant = invoice.tenant;
        const property = invoice.property;
        const unit = invoice.unit;
        const invoiceNumber = generateInvoiceNumber(String(invoice._id));
        const pdfBuffer = await generateInvoicePDF({
            invoiceNumber,
            tenantName: tenant?.name ?? "N/A",
            tenantPhone: tenant?.phone ?? "N/A",
            propertyName: property?.name ?? "N/A",
            unitName: unit?.unitName ?? "N/A",
            month: invoice.month,
            year: invoice.year,
            paymentDate: new Date(),
            paymentMethod: "—",
            baseRent: invoice.baseRent ?? 0,
            waterBill: invoice.waterBill ?? 0,
            gasBill: invoice.gasBill ?? 0,
            electricityBill: invoice.electricityBill ?? 0,
            serviceCharge: invoice.serviceCharge ?? 0,
            otherBill: invoice.otherBill ?? 0,
            totalAmount: invoice.totalAmount,
            paidAmount: invoice.paidAmount,
            dueAmount: Math.max(0, invoice.dueAmount),
            ownerName: "মালিক",
            status: invoice.status,
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoiceNumber}.pdf"`);
        res.setHeader("Content-Length", pdfBuffer.length);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ৫. Maintenance Request করা (Tenant-এর পক্ষ থেকে)
// ============================================================
export const tenantCreateMaintenance = async (req, res) => {
    try {
        const tenantId = req.user.id;
        const { title, description, priority } = req.body;
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
        }
        const maintenance = await Maintenance.create({
            title,
            description,
            priority: priority || "Medium",
            status: "Pending",
            property: tenant.property,
            unit: tenant.unit,
            tenant: tenantId,
            owner: tenant.owner,
        });
        // বাড়িওয়ালাকে নোটিফিকেশন পাঠানো
        await sendNotification({
            recipient: String(tenant.owner),
            type: "maintenance",
            title: "নতুন মেইনটেন্যান্স রিকোয়েস্ট! 🛠️",
            message: `${tenant.name} থেকে একটি নতুন অনুরোধ এসেছে: "${title}"`,
            link: "/maintenance",
        });
        res.status(201).json({ success: true, message: "অনুরোধ পাঠানো হয়েছে!", maintenance });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ৬. Tenant-এর Maintenance Requests দেখা
// ============================================================
export const getTenantMaintenance = async (req, res) => {
    try {
        const tenantId = req.user.id;
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
        }
        const requests = await Maintenance.find({
            unit: tenant.unit,
            owner: tenant.owner,
        })
            .sort({ createdAt: -1 })
            .populate("property", "name")
            .populate("unit", "unitName");
        res.json({ success: true, requests });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
// ============================================================
// ৭. Tenant Portal Enable/Disable করা (Landlord)
// ============================================================
export const setTenantPortalAccess = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { tenantId } = req.params;
        const { enabled, password } = req.body;
        const tenant = await Tenant.findOne({ _id: tenantId, owner: ownerId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: "ভাড়াটিয়া পাওয়া যায়নি!" });
        }
        tenant.portalEnabled = Boolean(enabled);
        if (password) {
            tenant.portalPassword = password; // pre-save hook hash করবে
        }
        await tenant.save();
        res.json({
            success: true,
            message: enabled ? "পোর্টাল এনাবল করা হয়েছে!" : "পোর্টাল ডিসেবল করা হয়েছে!",
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
//# sourceMappingURL=tenantPortal.controller.js.map