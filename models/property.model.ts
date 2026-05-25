import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "বিল্ডিং-এর নাম আবশ্যক"],
    trim: true,
  },
  location: {
    type: String,
    required: [true, "লোকেশন বা ঠিকানা আবশ্যক"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalFloors: {
    type: Number,
    required: [true, "তলার সংখ্যা আবশ্যক"],
    min: 0,
  },

  // ছবিগুলো সেভ করার জন্য
  images: [
    {
      type: String,
    },
  ],
  rent: {
    type: Number,
    default: 0,
  },
  bedrooms: {
    type: Number,
    default: 1,
  },
  bathrooms: {
    type: Number,
    default: 1,
  },
  area: {
    type: Number,
    default: 0, // square feet
  },
  description: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  googleMapUrl: {
    type: String,
    trim: true,
    default: "",
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["available", "rented"],
    default: "available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Property = mongoose.model('Property', propertySchema)
export default Property
