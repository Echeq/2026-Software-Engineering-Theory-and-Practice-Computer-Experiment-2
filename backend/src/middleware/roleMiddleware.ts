import { Response, NextFunction } from "express";
import { AuthRequest } from "./readSession";

function hasRole(req: AuthRequest, ...roles: string[]): boolean {
    return !!req.user && roles.includes(req.user.role);
}

export function requireSoporte(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void {
    if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }
    if (req.user.role !== "support") {
        res.status(403).json({ message: "Soporte access required" });
        return;
    }
    next();
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
    if (req.user.role !== "manager" && req.user.role !== "support") {
        res.status(403).json({ message: "Manager access required" });
        return;
    }
    next();
}

export function requireSupervisor(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): void {
    if (!req.user) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }
    if (!hasRole(req, "support", "manager")) {
        res.status(403).json({ message: "Access denied. Supervisor role required." });
        return;
    }
    next();
}

export { AuthRequest };
