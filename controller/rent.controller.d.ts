import type { Request as Req, Response as Res } from "express";
export declare const generateInvoice: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const collectPayment: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const downloadInvoicePDF: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getPendingInvoices: (req: Req, res: Res) => Promise<void>;
export declare const getTenantRentHistory: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getInvoiceTransactions: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const editInvoice: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const deleteInvoice: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rent.controller.d.ts.map