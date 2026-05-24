import { Router, Response } from "express";
import { UserModel } from "../models/User";
import { AuthRequest } from "../middleware/readSession";
import { requireManager } from "../middleware/roleMiddleware";

const router = Router();

router.get("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    const users = UserModel.listAll();
    res.json({ users });
});

router.post("/", requireManager, async (req: AuthRequest, res: Response) => {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
        res.status(400).json({ message: "Name, email, and password are required" });
        return;
    }

    if (UserModel.findByEmail(email.trim())) {
        res.status(409).json({ message: "A user with this email already exists" });
        return;
    }

    try {
        const user = await UserModel.create({ name: name.trim(), email: email.trim(), password });
        res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at }
        });
    } catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ message: "Failed to create user" });
    }
});

router.delete("/:id", requireManager, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (req.params.id === req.user.id) {
        res.status(400).json({ message: "You cannot remove yourself" });
        return;
    }

    const user = UserModel.findById(req.params.id);
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    UserModel.delete(req.params.id);
    res.json({ message: "User removed successfully" });
});

export default router;
