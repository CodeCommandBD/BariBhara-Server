import mongoose from "mongoose";

const tenantNotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["payment", "maintenance", "system", "invoice", "reminder"],
    default: "system",
  },
  isRead: { type: Boolean, default: false },
  link: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const TenantNotification = mongoose.model("TenantNotification", tenantNotificationSchema);
export default TenantNotification;
