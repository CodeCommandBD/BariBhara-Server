import type { Request as Req, Response as Res } from "express";
export declare const createUnit: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getUnitsByProperty: (req: Req, res: Res) => Promise<void>;
export declare const updateUnit: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteUnit: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=unit.controller.d.ts.map