import type { Request as Req, Response as Res } from "express";
export declare const addTenant: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getAllTenants: (req: Req, res: Res) => Promise<void>;
export declare const getTenantByUnit: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const updateTenant: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const vacateTenant: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const toggleAutoRenew: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const renewLease: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const generateAgreement: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const signAgreement: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteAgreement: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=tenant.controller.d.ts.map