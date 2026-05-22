declare class MemoryCache {
    private store;
    private cleanupInterval;
    constructor();
    set<T>(key: string, data: T, ttlSeconds: number): void;
    get<T>(key: string): T | null;
    delete(key: string): void;
    deleteByPrefix(prefix: string): void;
    private cleanup;
    stats(): {
        size: number;
        keys: string[];
    };
    destroy(): void;
}
export declare const cache: MemoryCache;
export declare const CACHE_TTL: {
    readonly DASHBOARD_STATS: number;
    readonly REVENUE_ANALYTICS: number;
    readonly RECENT_TRANSACTIONS: number;
    readonly LEASE_ALERTS: number;
};
export {};
//# sourceMappingURL=cache.service.d.ts.map