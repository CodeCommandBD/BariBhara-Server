import mongoose from "mongoose";

const unitSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  unitName: {
    type: String,
    required: [true, "ইউনিটের নাম বা নম্বর আবশ্যক"], // যেমন: মায়ের দোয়া-১ বা Flat-4A
    trim: true,
  },
  floor: {
    type: Number,
    required: [true, "ফ্লোর নম্বর আবশ্যক"],
    min: 0,
  },
  type: {
    type: String,
    enum: ["ফ্ল্যাট", "রুম", "সিট", "দোকান"], // ক্যাটাগরি ফিক্সড করে দেওয়া হলো
    required: true,
  },
  rent: {
    type: Number,
    required: [true, "ভাড়ার পরিমাণ আবশ্যক"],
    min: 0,
  },
  status: {
    type: String,
    enum: ["খালি", "ভাড়া হয়েছে", "মেরামত চলছে"], // মেইনটেন্যান্স স্ট্যাটাস যোগ করা হয়েছে
    default: "খালি" 
  },
  currentTenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // বর্তমানে রুমে কে আছে তার রেকর্ড
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Unit = mongoose.model('Unit', unitSchema);
export default Unit;