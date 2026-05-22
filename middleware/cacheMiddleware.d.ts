import type { Request, Response, NextFunction } from "express";
export declare const cacheMiddleware: (prefix: string, ttlSeconds: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const invalidateDashboardCache: (userId: string) => void;
//# sourceMappingURL=cacheMiddleware.d.ts.map