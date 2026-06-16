import { Router, Response } from "express";
import { UserModel } from "../models/User";
import { AuthRequest } from "../middleware/readSession";
import { requireManager, requireSoporte } from "../middleware/roleMiddleware";

const router = Router();

router.get("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }
    if (req.user.role !== "support" && req.user.role !== "manager") {
        res.status(403).json({ message: "Access denied" });
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

router.post("/:id/change-role", requireSoporte, (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const targetUser = UserModel.findById(req.params.id);
    if (!targetUser) {
        res.status(404).json({ message: "User not found" });
        return;
    }

    if (targetUser.role === "support") {
        res.status(400).json({ message: "Cannot change role of a support user" });
        return;
    }

    if (targetUser.id === req.user.id) {
        res.status(400).json({ message: "You cannot change your own role" });
        return;
    }

    const newRole = req.body.newRole || "manager";
    if (newRole !== "manager" && newRole !== "support") {
        res.status(400).json({ message: "Target role must be 'manager' or 'support'" });
        return;
    }

    const updated = UserModel.updateRole(req.params.id, newRole);
    if (!updated) {
        res.status(500).json({ message: "Failed to update role" });
        return;
    }

    res.json({ message: `User role updated to ${newRole}`, user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role } });
});

export default router;
