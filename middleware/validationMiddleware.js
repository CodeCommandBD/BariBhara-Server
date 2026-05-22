// Zod দিয়ে request body validate করার middleware
export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = result.error.issues;
            const firstError = issues[0];
            const message = firstError?.message || "ইনপুট ডাটা সঠিক নয়!";
            const errors = issues.map((e) => ({
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
//# sourceMappingURL=validationMiddleware.js.map