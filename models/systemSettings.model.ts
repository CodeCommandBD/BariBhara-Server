import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "main_config"
  },
  bkashNumber: {
    type: String,
    default: "০১৭XX-XXXXXX"
  },
  nagadNumber: {
    type: String,
    default: "০১৭XX-XXXXXX"
  },
  rocketNumber: {
    type: String,
    default: ""
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
export default SystemSettings;
