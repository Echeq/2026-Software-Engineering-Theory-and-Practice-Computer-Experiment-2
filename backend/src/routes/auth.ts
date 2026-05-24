import { Router, Response } from "express";
import crypto from "crypto";
import { UserModel } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/readSession";
import { SessionModel } from "../models/Session";


const router = Router();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function writeSessionCookie(res: Response, sessionId: string): void {
    res.setHeader(
        "Set-Cookie",
        `sessionId=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
    );
}

function clearSessionCookie(res: Response): void {
    res.setHeader(
        "Set-Cookie",
        "sessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
}

function readSessionId(cookieHeader?: string): string {
    if (!cookieHeader) {
        return "";
    }

    const sessionPair = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("sessionId="));

    if (!sessionPair) {
        return "";
    }

    return decodeURIComponent(sessionPair.slice("sessionId=".length));
}

router.post("/login", async (req, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = UserModel.findByEmail(email);

        if (
            !user ||
            !(await UserModel.verifyPassword(password, user.password_hash))
        ) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        SessionModel.deleteExpired();

        const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
        const csrfToken = crypto.randomBytes(32).toString("hex");
        const session = SessionModel.create({
            user_id: user.id,
            csrf_token: csrfToken,
            expires_at: expiresAt,
            ip_address: req.ip || null,
            user_agent: req.get("user-agent") || null,
        });

        writeSessionCookie(res, session.id);
        res.json({
            message: "Login successful",
            redirectTo: "/dashboard",
            token: csrfToken,
            csrfToken,
        });
        return;
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.get("/me", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    res.json({
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        }
    });
});

router.put("/password", authenticateToken, async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "currentPassword and newPassword are required" });
        return;
    }
    if (newPassword.length < 6) {
        res.status(400).json({ message: "New password must be at least 6 characters" });
        return;
    }
    const user = UserModel.findById(req.user.id);
    if (!user || !(await UserModel.verifyPassword(currentPassword, user.password_hash))) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
    }
    await UserModel.updatePassword(req.user.id, newPassword);
    res.json({ message: "Password updated successfully" });
});

router.put("/profile", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    const { name } = req.body;
    if (!name?.trim()) {
        res.status(400).json({ message: "Name is required" });
        return;
    }
    const updated = UserModel.updateName(req.user.id, name.trim());
    res.json({ user: { id: updated!.id, name: updated!.name, email: updated!.email, role: updated!.role } });
});

router.post("/logout", (req, res: Response) => {
    const sessionId = readSessionId(req.headers.cookie);

    if (sessionId) {
        SessionModel.delete(sessionId);
    }

    clearSessionCookie(res);
    res.json({ message: "Logged out successfully" });
});

export default router;
