import type { Request as Req, Response as Res } from "express";
export declare const getLandlordStats: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getRevenueAnalytics: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getRecentTransactions: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getLeaseExpiryAlerts: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const clearDashboardCache: (userId: string) => void;
//# sourceMappingURL=dashboard.controller.d.ts.map