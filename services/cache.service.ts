// ========================================
// Simple In-Memory Cache Service (TTL-based)
// Redis ছাড়া দ্রুত caching এর জন্য
// ========================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number; // Unix timestamp (ms)
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // প্রতি ৫ মিনিটে মেয়াদ উত্তীর্ণ এন্ট্রি পরিষ্কার করা
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  // ক্যাশে সেট করা (ttlSeconds = কত সেকেন্ড ধরে রাখবে)
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  // ক্যাশ থেকে ডাটা নেওয়া (মেয়াদ শেষ হলে null)
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  // নির্দিষ্ট একটি key ডিলিট করা
  delete(key: string): void {
    this.store.delete(key);
  }

  // কোনো prefix দিয়ে শুরু সব key ডিলিট করা (cache invalidation)
  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  // মেয়াদ উত্তীর্ণ এন্ট্রি পরিষ্কার করা
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  // ক্যাশের বর্তমান অবস্থা (debugging)
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// সিঙ্গেলটন ইনস্ট্যান্স — পুরো অ্যাপে একটাই
export const cache = new MemoryCache();

// ======================================
// Cache TTL Constants (সেকেন্ডে)
// ======================================
export const CACHE_TTL = {
  DASHBOARD_STATS: 3 * 60,        // ৩ মিনিট
  REVENUE_ANALYTICS: 10 * 60,     // ১০ মিনিট (পরিবর্তন কম হয়)
  RECENT_TRANSACTIONS: 2 * 60,    // ২ মিনিট
  LEASE_ALERTS: 5 * 60,           // ৫ মিনিট
} as const;
