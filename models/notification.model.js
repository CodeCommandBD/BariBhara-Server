import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["payment", "maintenance", "system", "invoice"],
        default: "system",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String, // ক্লিক করলে কোন পেজে যাবে
        default: "",
    },
}, { timestamps: true });
const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
//# sourceMappingURL=notification.model.js.map