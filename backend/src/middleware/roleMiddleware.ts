import { Request, Response, NextFunction } from "express";
import { UserModel, User } from "../models/User";

export interface AuthRequest extends Request {
    user?: User;
    sessionId?: string;
}

export function requireManager(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void {
    if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    if (req.user.role !== "manager") {
        res.status(403).json({ message: "Manager access required" });
        return;
    }

    next();
}
