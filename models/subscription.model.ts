import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    plan: {
        type: String,
        enum: ["basic", "pro"],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    senderNumber: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["bkash", "nagad", "rocket"],
        required: true
    },
    trxId: {
        type: String,
        sparse: true,
        unique: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    rejectionReason: {
        type: String,
        default: ""
    },
    screenshot: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
