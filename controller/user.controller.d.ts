import type { Request as Req, Response as Res } from "express";
declare const registerUser: (req: Req, res: Res) => Promise<Res<any, Record<string, any>>>;
declare const loginUser: (req: Req, res: Res) => Promise<Res<any, Record<string, any>>>;
declare const forgotPassword: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
declare const verifyResetOTP: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
declare const resetPassword: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export { registerUser, loginUser, forgotPassword, verifyResetOTP, resetPassword };
//# sourceMappingURL=user.controller.d.ts.map