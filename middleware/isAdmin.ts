import type { Request, Response, NextFunction } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const user = (req as any).user;
        
        if (!user || user.role !== "admin") {
            res.status(403).json({ message: "Access denied. Admin resources only." });
            return;
        }
        
        next();
    } catch (error) {
        res.status(500).json({ message: "Internal server error in admin authorization" });
    }
};
