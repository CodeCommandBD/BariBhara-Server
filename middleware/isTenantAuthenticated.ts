import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

// Tenant JWT authentication middleware
// শুধুমাত্র tenant role-এর token গ্রহণ করবে
export const isTenantAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "অনুমোদন নেই! টোকেন দিন।" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token!, JWT_SECRET) as unknown as { id: string; role: string };

    if (decoded.role !== "tenant") {
      return res.status(403).json({ success: false, message: "শুধুমাত্র ভাড়াটিয়াদের জন্য!" });
    }

    (req as any).user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "টোকেন অবৈধ বা মেয়াদ শেষ!" });
  }
};
