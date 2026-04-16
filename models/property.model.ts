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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Property = mongoose.model('Property', propertySchema)
export default Property
