import type { Request, Response } from "express";
import Analytics from "../models/analytics.model.js";
import Property from "../models/property.model.js";

// Helper: detect device type from User-Agent
function detectDevice(userAgent: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/.test(ua)) return "mobile";
  if (ua.includes("windows") || ua.includes("macintosh") || ua.includes("linux")) return "desktop";
  return "unknown";
}

// Helper: get client IP
function getIP(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// ==========================================
// ১. PUBLIC: Track an analytics event
// POST /api/analytics/track
// ==========================================
export async function trackEvent(req: Request, res: Response): Promise<void> {
  try {
    const { event, propertyId, metadata, sessionId, referrer } = req.body;

    // Validate event type
    const validEvents = [
      "pageView", "propertyView", "search", "whatsappClick",
      "callClick", "propertyFavorite", "registration", "filterUsed",
    ];
    if (!validEvents.includes(event)) {
      res.status(400).json({ success: false, message: "Invalid event type" });
      return;
    }

    const userAgent = req.headers["user-agent"] || "";
    const device = detectDevice(userAgent);
    const ip = getIP(req);

    await Analytics.create({
      event,
      propertyId: propertyId || undefined,
      metadata: metadata || {},
      sessionId: sessionId || undefined,
      ip,
      userAgent: userAgent.substring(0, 256), // Trim long UAs
      device,
      referrer: referrer || req.headers["referer"] || "",
    });

    res.status(201).json({ success: true });
  } catch (error) {
    // Silently fail — analytics should never break user experience
    console.error("Analytics track error:", error);
    res.status(500).json({ success: false });
  }
}

// ==========================================
// ২. ADMIN: Get analytics dashboard data
// GET /api/analytics/dashboard?days=7
// ==========================================
export async function getAnalyticsDashboard(req: Request, res: Response): Promise<void> {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days as string) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);

    // All events in this time range
    const [
      totalViews,
      totalSearches,
      totalContactClicks,
      totalFavorites,
      totalRegistrations,
      eventBreakdown,
      dailyTimeSeries,
      topSearchedLocations,
      topViewedProperties,
      deviceBreakdown,
    ] = await Promise.all([
      // Total pageViews + propertyViews
      Analytics.countDocuments({ event: { $in: ["pageView", "propertyView"] }, createdAt: { $gte: since } }),

      // Total searches
      Analytics.countDocuments({ event: "search", createdAt: { $gte: since } }),

      // Total contact clicks (whatsapp + call)
      Analytics.countDocuments({ event: { $in: ["whatsappClick", "callClick"] }, createdAt: { $gte: since } }),

      // Total favorites
      Analytics.countDocuments({ event: "propertyFavorite", createdAt: { $gte: since } }),

      // Total registrations
      Analytics.countDocuments({ event: "registration", createdAt: { $gte: since } }),

      // Event breakdown pie chart
      Analytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Daily time series
      Analytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
              event: "$event",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),

      // Top searched locations
      Analytics.aggregate([
        { $match: { event: "search", createdAt: { $gte: since }, "metadata.query": { $exists: true, $ne: "" } } },
        { $group: { _id: "$metadata.query", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Top 5 most viewed properties
      Analytics.aggregate([
        { $match: { event: "propertyView", createdAt: { $gte: since }, propertyId: { $exists: true } } },
        { $group: { _id: "$propertyId", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "properties",
            localField: "_id",
            foreignField: "_id",
            as: "property",
          },
        },
        { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            views: 1,
            name: "$property.name",
            location: "$property.location",
            images: "$property.images",
          },
        },
      ]),

      // Device breakdown
      Analytics.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$device", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Calculate conversion rate: (contacts / views) * 100
    const conversionRate = totalViews > 0 ? ((totalContactClicks / totalViews) * 100).toFixed(1) : "0";

    // Format daily time series into {date: string, pageViews: number, searches: number, contacts: number}[]
    const dailyMap: Record<string, any> = {};
    for (const item of dailyTimeSeries) {
      const { date, event: ev } = item._id;
      if (!dailyMap[date]) dailyMap[date] = { date, pageViews: 0, searches: 0, contacts: 0, favorites: 0 };
      if (ev === "pageView" || ev === "propertyView") dailyMap[date].pageViews += item.count;
      if (ev === "search") dailyMap[date].searches += item.count;
      if (ev === "whatsappClick" || ev === "callClick") dailyMap[date].contacts += item.count;
      if (ev === "propertyFavorite") dailyMap[date].favorites += item.count;
    }

    // Fill in missing days with 0s
    const filledDailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      filledDailyData.push(
        dailyMap[dateStr] || { date: dateStr, pageViews: 0, searches: 0, contacts: 0, favorites: 0 }
      );
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalViews,
          totalSearches,
          totalContactClicks,
          totalFavorites,
          totalRegistrations,
          conversionRate: parseFloat(conversionRate),
          days,
        },
        eventBreakdown,
        dailyTimeSeries: filledDailyData,
        topSearchedLocations,
        topViewedProperties,
        deviceBreakdown,
      },
    });
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({ success: false, message: "Analytics fetch failed" });
  }
}
