import mongoose, { Schema, Document } from "mongoose";
const maintenanceSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
    tenant: { type: Schema.Types.ObjectId, ref: "Tenant" },
    status: {
        type: String,
        enum: ["Pending", "In Progress", "Resolved"],
        default: "Pending",
    },
    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium",
    },
    reportedDate: { type: Date, default: Date.now },
    resolvedDate: { type: Date },
    cost: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });
const Maintenance = mongoose.model("Maintenance", maintenanceSchema);
export default Maintenance;
//# sourceMappingURL=maintenance.model.js.map