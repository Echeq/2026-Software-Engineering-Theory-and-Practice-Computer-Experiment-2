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
        `token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
}

router.post("/register", async (req, res: Response) => {
    try {
        const { name, email, password }: CreateUserInput = req.body;

        // Validate input
        if (!name || !email || !password) {
            res.status(400).json({
                message: "Name, email, and password are required",
            });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({
                message: "Password must be at least 6 characters",
            });
            return;
        }

        // Check if user already exists
        const existingUser = UserModel.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: "Email already registered" });
            return;
        }

        // Create new user
        const user = await UserModel.create({ name, email, password });

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

>>>>>>> main
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
            csrfToken,
        });
        return;
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
        return;
    }
});

router.post("/logout", (req, res: Response) => {
    res.setHeader(
        "Set-Cookie",
        "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );
    res.json({ message: "Logged out successfully" });
});

export default router;
