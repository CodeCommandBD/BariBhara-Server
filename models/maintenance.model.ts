import mongoose, { Schema, Document } from "mongoose";

export interface IMaintenance extends Document {
  title: string;
  description: string;
  property: mongoose.Types.ObjectId;
  unit?: mongoose.Types.ObjectId;
  status: "Pending" | "In Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  reportedDate: Date;
  resolvedDate?: Date;
  cost?: number;
  owner: mongoose.Types.ObjectId;
}

const maintenanceSchema = new Schema<IMaintenance>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    unit: { type: Schema.Types.ObjectId, ref: "Unit" },
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
  },
  { timestamps: true }
);

const Maintenance = mongoose.model<IMaintenance>("Maintenance", maintenanceSchema);
export default Maintenance;
