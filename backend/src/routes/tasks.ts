import { Router, Response } from "express";
import { TaskModel, CreateTaskInput } from "../models/Task";
import { ProjectModel } from "../models/Project";
import { AuthRequest } from "../middleware/roleMiddleware";

const router = Router();

function canManageTasks(userRole: string): boolean {
    return userRole === "support" || userRole === "manager";
}

// Get all tasks assigned to the authenticated user
router.get("/my-tasks", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const tasks = TaskModel.findByAssignedTo(req.user.id);
    res.json({ tasks });
});

// Get a single task by ID
router.get("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const task = TaskModel.findById(req.params.id);

    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }

    res.json({ task });
});

// Create a new task – only support/manager
router.post("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (!canManageTasks(req.user.role)) {
        res.status(403).json({ message: "Only managers and soporte can create tasks" });
        return;
    }

    const {
        title,
        description,
        project_id,
        assigned_to,
        priority,
        due_date,
        tags,
        estimated_hours,
    }: CreateTaskInput = req.body;

    if (!title || !project_id) {
        res.status(400).json({ message: "Title and project_id are required" });
        return;
    }

    const project = ProjectModel.findById(project_id);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id && req.user.role !== "support") {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const task = TaskModel.create({
        title,
        description,
        project_id,
        assigned_to,
        priority,
        due_date,
        tags,
        estimated_hours,
    });

    res.status(201).json({ task });
});

// Update a task – support/manager can edit everything, member can only change status
router.put("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const task = TaskModel.findById(req.params.id);

    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }

    const isSupervisor = canManageTasks(req.user.role);

    if (isSupervisor) {
        const updated = TaskModel.update(req.params.id, req.body);
        res.json({ task: updated });
        return;
    }

    // member: can only update status (move task)
    const allowedKeys = ["status"];
    const updateKeys = Object.keys(req.body);
    const onlyStatus = updateKeys.every((k) => allowedKeys.includes(k));

    if (!onlyStatus) {
        res.status(403).json({ message: "Members can only change task status" });
        return;
    }

    const updated = TaskModel.update(req.params.id, { status: req.body.status });
    res.json({ task: updated });
});

// Delete a task – only support/manager
router.delete("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    if (!canManageTasks(req.user.role)) {
        res.status(403).json({ message: "Only managers and soporte can delete tasks" });
        return;
    }

    const task = TaskModel.findById(req.params.id);

    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }

    TaskModel.delete(req.params.id);
    res.json({ message: "Task deleted successfully" });
});

export default router;
