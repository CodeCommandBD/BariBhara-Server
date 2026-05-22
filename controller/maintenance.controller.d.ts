import type { Request as Req, Response as Res } from "express";
export declare const getAllMaintenance: (req: Req, res: Res) => Promise<void>;
export declare const createMaintenance: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const updateMaintenanceStatus: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteMaintenance: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=maintenance.controller.d.ts.map