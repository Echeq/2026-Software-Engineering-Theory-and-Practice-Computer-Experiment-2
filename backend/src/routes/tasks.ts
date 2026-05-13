import { Router, Response } from "express";
import { TaskModel, CreateTaskInput } from "../models/Task";
import { ProjectModel } from "../models/Project";
import { AuthRequest } from "../middleware/roleMiddleware";

const router = Router();

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

// Create a new task
router.post("/", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const {
        title,
        description,
        project_id,
        assigned_to,
        priority,
        due_date,
    }: CreateTaskInput = req.body;

    if (!title || !project_id) {
        res.status(400).json({ message: "Title and project_id are required" });
        return;
    }

    // Verify project exists and user has access
    const project = ProjectModel.findById(project_id);
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    if (project.owner_id !== req.user.id) {
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
    });

    res.status(201).json({ task });
});

// Update a task
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

    // Check if user owns the project or is assigned to the task
    const project = ProjectModel.findById(task.project_id);
    if (
        !project ||
        (project.owner_id !== req.user.id && task.assigned_to !== req.user.id)
    ) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    const updated = TaskModel.update(req.params.id, req.body);
    res.json({ task: updated });
});

// Delete a task
router.delete("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const task = TaskModel.findById(req.params.id);

    if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
    }

    const project = ProjectModel.findById(task.project_id);
    if (!project || project.owner_id !== req.user.id) {
        res.status(403).json({ message: "Access denied" });
        return;
    }

    TaskModel.delete(req.params.id);
    res.json({ message: "Task deleted successfully" });
});

export default router;
