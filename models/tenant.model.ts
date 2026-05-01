import mongoose from "mongoose";

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
      required: [true, "ফোন নম্বর আবশ্যক"],
      trim: true,
    },
    nid: {
      type: String,
      trim: true,
    },
    photo: {
      type: String, // Cloudinary URL
      default: "",
    },

    // ৩. চুক্তির তথ্য (Lease Info)
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
      type: Date, // ঐচ্ছিক — মাসিক চুক্তিতে লাগে না
    },

    // ৪. স্ট্যাটাস (Status)
    status: {
      type: String,
      enum: ["সক্রিয়", "চলে গেছে"],
      default: "সক্রিয়",
    },
  },
  {
    timestamps: true, // createdAt ও updatedAt অটো যোগ হবে
  }
);

const Tenant = mongoose.model("Tenant", tenantSchema);
export default Tenant;
