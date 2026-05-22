import type { Request as Req, Response as Res } from "express";
export declare const uploadDocument: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getDocuments: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteDocument: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const generateLeasePDF: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=document.controller.d.ts.map