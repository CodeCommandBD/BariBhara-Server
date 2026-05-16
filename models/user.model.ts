import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ["tenant", "landlord"],
        default: "tenant"
    },
    photo: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    trustedDevices: {
        type: [String],
        default: []
    },
    agreementTemplate: {
        type: String,
        default: "১. ভাড়াটিয়া প্রতি মাসের ৫ তারিখের মধ্যে ভাড়া পরিশোধ করতে বাধ্য থাকিবেন।\n২. প্রপার্টির কোনো ক্ষতি হইলে ভাড়াটিয়া তাহা মেরামত করিয়া দিতে বাধ্য থাকিবেন।\n৩. বাসা ছাড়ার অন্তত এক মাস পূর্বে জানাইতে হইবে।\n৪. সাব-লেট দেওয়া সম্পূর্ণ নিষেধ।"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

export default User;