import type { Request as Req, Response as Res } from "express";
export declare const getFinancialReport: (req: Req, res: Res) => Promise<void>;
export declare const getPropertiesForFilter: (req: Req, res: Res) => Promise<void>;
export declare const exportTransactionsCSV: (req: Req, res: Res) => Promise<void>;
export declare const exportExpensesCSV: (req: Req, res: Res) => Promise<void>;
export declare const getMonthlyTrend: (req: Req, res: Res) => Promise<void>;
export declare const getOccupancyStats: (req: Req, res: Res) => Promise<void>;
export declare const exportExcel: (req: Req, res: Res) => Promise<void>;
//# sourceMappingURL=reports.controller.d.ts.map