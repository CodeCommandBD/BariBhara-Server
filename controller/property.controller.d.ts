import type { Request as Req, Response as Res } from "express";
export declare const createProperty: (req: Req, res: Res) => Promise<void>;
export declare const getMyProperties: (req: Req, res: Res) => Promise<void>;
export declare const getPropertyDetail: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const updateProperty: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteProperty: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=property.controller.d.ts.map