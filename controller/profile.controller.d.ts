import type { Request as Req, Response as Res } from "express";
import "dotenv/config";
export declare const getProfile: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const updateProfile: (req: Req, res: Res) => Promise<void>;
export declare const updateProfilePhoto: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const changePassword: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=profile.controller.d.ts.map