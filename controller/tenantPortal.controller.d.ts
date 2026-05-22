import type { Request as Req, Response as Res } from "express";
export declare const tenantLogin: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getTenantDashboard: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getTenantInvoices: (req: Req, res: Res) => Promise<void>;
export declare const downloadTenantInvoicePDF: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const tenantCreateMaintenance: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getTenantMaintenance: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const setTenantPortalAccess: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=tenantPortal.controller.d.ts.map