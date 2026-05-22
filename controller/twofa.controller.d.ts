import type { Request as Req, Response as Res } from "express";
export declare const sendOTP: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const verifyOTP: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const toggle2FA: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const verifyLoginOTP: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const sendLoginOTP: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=twofa.controller.d.ts.map