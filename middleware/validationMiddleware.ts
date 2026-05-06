import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

// Zod দিয়ে request body validate করার middleware
export const validate = (schema: ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues;
      const firstError = issues[0];
      const message = firstError?.message || "ইনপুট ডাটা সঠিক নয়!";

      const errors = issues.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message,
        errors,
      });
    }

    req.body = result.data;
    next();
  };
};
