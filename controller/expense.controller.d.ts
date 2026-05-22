import type { Request as Req, Response as Res } from "express";
export declare const addExpense: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
export declare const getExpenses: (req: Req, res: Res) => Promise<void>;
export declare const deleteExpense: (req: Req, res: Res) => Promise<Res<any, Record<string, any>> | undefined>;
//# sourceMappingURL=expense.controller.d.ts.map