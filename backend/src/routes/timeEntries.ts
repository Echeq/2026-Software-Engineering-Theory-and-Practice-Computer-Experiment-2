import { Router, Response } from "express";
import { TimeEntryModel } from "../models/TimeEntry";
import { TaskModel } from "../models/Task";
import { AuthRequest } from "../middleware/readSession";

const router = Router();

// Get all time entries for a task
router.get("/task/:taskId", (req: AuthRequest, res: Response) => {
    if (!req.user) { res.status(401).json({ message: "Not authenticated" }); return; }
    const task = TaskModel.findById(req.params.taskId);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    const entries = TimeEntryModel.findByTaskId(req.params.taskId);
    res.json({ entries });
});

// Create a time entry
router.post("/", (req: AuthRequest, res: Response) => {
    if (!req.user) { res.status(401).json({ message: "Not authenticated" }); return; }
    const { task_id, description, hours, date } = req.body;
    if (!task_id || !hours || !date) {
        res.status(400).json({ message: "task_id, hours, and date are required" });
        return;
    }
    const task = TaskModel.findById(task_id);
    if (!task) { res.status(404).json({ message: "Task not found" }); return; }
    const entry = TimeEntryModel.create({ task_id, user_id: req.user.id, description, hours, date });
    res.status(201).json({ entry });
});

// Delete a time entry
router.delete("/:id", (req: AuthRequest, res: Response) => {
    if (!req.user) { res.status(401).json({ message: "Not authenticated" }); return; }
    const entry = TimeEntryModel.findById(req.params.id);
    if (!entry) { res.status(404).json({ message: "Time entry not found" }); return; }
    if (entry.user_id !== req.user.id) { res.status(403).json({ message: "Access denied" }); return; }
    TimeEntryModel.delete(req.params.id);
    res.json({ message: "Time entry deleted" });
});

export default router;
