import { UserModel, User } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { SessionModel } from "../models/Session";
export interface AuthRequest extends Request {
    user?: User;
    sessionId?: string;
    csrfToken?: string;
}

export function readCsrfToken(
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
): void {
    const csrfHeader = req.header("X-CSRF-Token") || req.header("x-csrf-token");
    req.csrfToken = csrfHeader?.trim() || undefined;
    next();
}

function requiresCsrfValidation(method: string): boolean {
    const normalizedMethod = method.toUpperCase();
    return !["GET", "HEAD", "OPTIONS"].includes(normalizedMethod);
}

function readCookieValue(
    cookieHeader: string | undefined,
    cookieName: string,
): string {
    if (!cookieHeader) {
        return "";
    }

    const cookiePair = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${cookieName}=`));

    if (!cookiePair) {
        return "";
    }

    return decodeURIComponent(cookiePair.slice(`${cookieName}=`.length));
}

export async function authenticateToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const sessionId = readCookieValue(req.headers.cookie, "sessionId");

    if (!sessionId) {
        res.status(401).json({ message: "Authentication required" });
        return;
    }

    try {
        const session = SessionModel.findActiveById(sessionId);

        if (!session) {
            res.status(403).json({ message: "Invalid or expired session" });
            return;
        }

        if (requiresCsrfValidation(req.method)) {
            if (!session.csrf_token || !req.csrfToken) {
                res.status(403).json({ message: "CSRF token required" });
                return;
            }

            if (req.csrfToken !== session.csrf_token) {
                res.status(403).json({ message: "Invalid CSRF token" });
                return;
            }
        }

        const user = await UserModel.findById(session.user_id);

        if (!user) {
            SessionModel.delete(sessionId);
            res.status(403).json({ message: "Invalid session" });
            return;
        }

        SessionModel.touch(sessionId);
        req.user = user;
        req.sessionId = sessionId;
        next();
    } catch (error) {
        res.status(500).json({ message: "Session validation failed" });
    }
}
