import type { Request, Response, NextFunction } from "express";
import { cache } from "../services/cache.service.js";

// ====================================================
// Cache Middleware — route-level caching
// ====================================================

// প্রতিটি ইউজারের জন্য আলাদা cache key তৈরি করে
// key format: "prefix:userId"
export const cacheMiddleware = (prefix: string, ttlSeconds: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    if (!userId) return next(); // authenticated না হলে cache skip

    const cacheKey = `${prefix}:${userId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      // ক্যাশ থেকে পাঠানো
      return res.status(200).json({
        ...cached as object,
        _cached: true,           // dev এ বোঝার জন্য
        _cachedAt: new Date().toISOString(),
      });
    }

    // original res.json কে override করা যাতে response cache হয়
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200 && body?.success) {
        cache.set(cacheKey, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

// ====================================================
// Cache Invalidation Helper
// নতুন পেমেন্ট / প্রপার্টি যোগ হলে ড্যাশবোর্ড cache clear
// ====================================================
export const invalidateDashboardCache = (userId: string) => {
  cache.deleteByPrefix(`dashboard_stats:${userId}`);
  cache.deleteByPrefix(`revenue_analytics:${userId}`);
  cache.deleteByPrefix(`recent_transactions:${userId}`);
  cache.deleteByPrefix(`lease_alerts:${userId}`);
};
