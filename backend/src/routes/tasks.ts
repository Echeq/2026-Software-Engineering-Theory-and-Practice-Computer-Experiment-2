import { Router, Response } from 'express';
import { TaskModel, CreateTaskInput } from '../models/Task';
import { ProjectModel } from '../models/Project';
import { AuthRequest } from '../middleware/auth';

const router = Router();

const VALID_STATUSES = ['pending', 'in-progress', 'completed'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

router.get('/my-tasks', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const tasks = TaskModel.findByAssignedTo(req.user.id);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  try {
    const tasks = TaskModel.findByOwnerProjects(req.user.id);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const task = TaskModel.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = ProjectModel.findById(task.project_id);
    if (!project || (project.owner_id !== req.user.id && task.assigned_to !== req.user.id)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const { title, description, project_id, assigned_to, priority, due_date }: CreateTaskInput = req.body;

    if (!title || !project_id) {
      res.status(400).json({ message: 'Title and project_id are required' });
      return;
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ message: 'Invalid priority value' });
      return;
    }

    const project = ProjectModel.findById(project_id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const task = TaskModel.create({
      title,
      description,
      project_id,
      assigned_to,
      priority,
      due_date
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const task = TaskModel.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = ProjectModel.findById(task.project_id);
    if (!project || (project.owner_id !== req.user.id && task.assigned_to !== req.user.id)) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { title, description, status, priority, due_date, assigned_to } = req.body;

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ message: 'Invalid priority value' });
      return;
    }

    const updated = TaskModel.update(req.params.id, { title, description, status, priority, due_date, assigned_to });
    res.json({ task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const task = TaskModel.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const project = ProjectModel.findById(task.project_id);
    if (!project || project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    TaskModel.delete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
