 import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const tenantSchema = new mongoose.Schema(
  {
    // ১. সম্পর্ক (Relations)
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: [true, "ইউনিট আইডি আবশ্যক"],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "প্রপার্টি আইডি আবশ্যক"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "মালিকের আইডি আবশ্যক"],
    },

    // ২. ব্যক্তিগত তথ্য (Personal Info)
    name: {
      type: String,
      required: [true, "ভাড়াটিয়ার নাম আবশ্যক"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "সঠিক WhatsApp নম্বর দেওয়া আবশ্যক"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    nid: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    nidVerification: {
      status: {
        type: String,
        enum: ["unsubmitted", "pending", "verified", "rejected"],
        default: "unsubmitted",
      },
      submittedAt: { type: Date },
      verifiedAt: { type: Date },
      rejectionReason: { type: String },
    },

    // ৩. পোর্টাল অ্যাক্সেস (Tenant Login)
    portalPassword: {
      type: String,
      default: null, // মালিক সেট করলে enable হবে
      select: false, // default query তে বাদ থাকবে
    },
    portalEnabled: {
      type: Boolean,
      default: false, // মালিক manually enable করবে
    },

    // ৪. চুক্তির তথ্য (Lease Info)
    rentAmount: {
      type: Number,
      required: [true, "ভাড়ার পরিমাণ আবশ্যক"],
      min: 0,
    },
    advanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    leaseStart: {
      type: Date,
      required: [true, "চুক্তি শুরুর তারিখ আবশ্যক"],
    },
    leaseEnd: {
      type: Date,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    renewalMonths: {
      type: Number,
      default: 12,
      min: 1,
      max: 60,
    },

    // ৫. ইউটিলিটি কনফিগারেশন (Utility Config)
    utilityConfig: {
      electricity: {
        type: { type: String, enum: ["Fixed", "Metered", "None"], default: "None" },
        fixedAmount: { type: Number, default: 0 },
        perUnitCost: { type: Number, default: 0 },
        lastReading: { type: Number, default: 0 },
      },
      gas: {
        type: { type: String, enum: ["Fixed", "Metered", "None"], default: "None" },
        fixedAmount: { type: Number, default: 0 },
        perUnitCost: { type: Number, default: 0 },
        lastReading: { type: Number, default: 0 },
      },
      water: {
        type: { type: String, enum: ["Fixed", "Metered", "None"], default: "None" },
        fixedAmount: { type: Number, default: 0 },
        perUnitCost: { type: Number, default: 0 },
        lastReading: { type: Number, default: 0 },
      },
      serviceCharge: {
        type: { type: String, enum: ["Fixed", "None"], default: "None" },
        fixedAmount: { type: Number, default: 0 },
      }
    },

    // ৬. ডকুমেন্টস (Documents)
    documents: [
      {
        type: { type: String, enum: ["nid", "photo", "contract", "other"], default: "other" },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // ৮. ডিজিটাল চুক্তি (Digital Agreement)
    agreement: {
      pdfUrl: { type: String, default: null },
      signatureUrl: { type: String, default: null },
      isSigned: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
    },

    // ৭. স্ট্যাটাস (Status)
    status: {
      type: String,
      enum: ["সক্রিয়", "চলে গেছে"],
      default: "সক্রিয়",
    },
  },
  {
    timestamps: true,
  }
);

// Password hash করার আগে
tenantSchema.pre("save", async function () {
  const doc = this as any;
  if (!doc.isModified("portalPassword") || !doc.portalPassword) return;
  doc.portalPassword = await bcrypt.hash(doc.portalPassword as string, 10);
});

// Password compare method
tenantSchema.methods["comparePassword"] = async function (candidatePassword: string): Promise<boolean> {
  const doc = this as any;
  if (!doc.portalPassword) return false;
  return bcrypt.compare(candidatePassword, doc.portalPassword);
};

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
