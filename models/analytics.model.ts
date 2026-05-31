import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    // Event type
    event: {
      type: String,
      enum: [
        "pageView",       // Homepage, marketplace section visit
        "propertyView",   // Individual property page view
        "search",         // Search query submitted
        "whatsappClick",  // WhatsApp contact button clicked
        "callClick",      // Call button clicked
        "propertyFavorite", // Property saved/favorited
        "registration",   // New user registered
        "filterUsed",     // Advanced filters applied
      ],
      required: true,
      index: true,
    },

    // Optional references
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      index: true,
    },

    // Metadata (search queries, locations, etc.)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Session / device info
    sessionId: { type: String, index: true },
    ip: { type: String },
    userAgent: { type: String },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
    },
    referrer: { type: String },
  },
  {
    timestamps: true,
    // TTL: Auto-delete events older than 1 year to keep DB lean
    // (Optional: remove if you want permanent history)
  }
);

// Compound indexes for fast aggregation queries
analyticsSchema.index({ event: 1, createdAt: -1 });
analyticsSchema.index({ propertyId: 1, event: 1 });
analyticsSchema.index({ createdAt: -1 });

const Analytics = mongoose.model("Analytics", analyticsSchema);
export default Analytics;
