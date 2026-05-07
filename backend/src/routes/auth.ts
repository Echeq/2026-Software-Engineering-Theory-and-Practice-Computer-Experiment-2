import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res: Response) => {
    try {
        const { name, password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

        if (!name || !email || !password) {
            res.status(400).json({ message: "Name, email, and password are required" });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ message: "Password must be at least 6 characters" });
            return;
        }

        const userCount = UserModel.count();
        let role: 'manager' | 'member' = 'member';

        if (userCount === 0) {
            // First user bootstraps as manager — no auth required
            role = 'manager';
        } else {
            // All subsequent accounts must be created by a manager
            const authHeader = req.headers["authorization"];
            const token = authHeader && authHeader.split(" ")[1];
            if (!token) {
                res.status(403).json({ message: "Manager authentication required to create accounts" });
                return;
            }
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500).json({ message: "Server misconfiguration" });
                return;
            }
            try {
                const decoded = jwt.verify(token, secret) as { userId: string };
                const manager = UserModel.findById(decoded.userId);
                if (!manager || manager.role !== 'manager') {
                    res.status(403).json({ message: "Only managers can create accounts" });
                    return;
                }
            } catch {
                res.status(403).json({ message: "Invalid or expired token" });
                return;
            }
        }

        const existingUser = UserModel.findByEmail(email);
        if (existingUser) {
            res.status(409).json({ message: "Email already registered" });
            return;
        }

        const user = await UserModel.create({ name, email, password, role });
        console.log(`[AUTH] Account created: ${user.email} (${user.role})`);

        res.status(201).json({
            message: role === 'manager' ? "Manager account created successfully" : "Member account created successfully",
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/login", async (req, res: Response) => {
    try {
        const { password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }

        const user = UserModel.findByEmail(email);
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const isValidPassword = await UserModel.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            res.status(500).json({ message: "Server misconfiguration" });
            return;
        }

        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: "24h" });
        console.log(`[AUTH] Login successful: ${user.email} (${user.role})`);

        res.json({
            message: "Login successful",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
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
        },
    });
});

export default router;
