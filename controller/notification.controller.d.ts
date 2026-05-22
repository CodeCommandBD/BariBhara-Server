import type { Request as Req, Response as Res } from "express";
export declare const getMyNotifications: (req: Req, res: Res) => Promise<void>;
export declare const markAllRead: (req: Req, res: Res) => Promise<void>;
export declare const markOneRead: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const clearAllNotifications: (req: Req, res: Res) => Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map