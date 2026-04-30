import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { UserModel, CreateUserInput } from "../models/User";
import { authenticateToken, AuthRequest } from "../middleware/auth";

const router = Router();

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

router.post("/login", async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                message: "Email and password are required",
            });
            return;
        }

        // Find user
        const user = UserModel.findByEmail(email);
        if (!user) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        // Verify password
        const isValidPassword = await UserModel.verifyPassword(
            password,
            user.password_hash,
        );
        if (!isValidPassword) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        // Generate JWT token
        const secret = process.env.JWT_SECRET || "default-secret";
        const token = jwt.sign({ userId: user.id }, secret, {
            expiresIn: "24h",
        });

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
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
        },
    });
});

export default router;
