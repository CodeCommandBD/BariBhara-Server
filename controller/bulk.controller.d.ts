import type { Request as Req, Response as Res } from "express";
export declare const getTenantsForBulk: (req: Req, res: Res) => Promise<void>;
export declare const generateBulkInvoices: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const toggleAutoRenewal: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const manualRenewLease: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getExpiringLeases: (req: Req, res: Res) => Promise<void>;
//# sourceMappingURL=bulk.controller.d.ts.map