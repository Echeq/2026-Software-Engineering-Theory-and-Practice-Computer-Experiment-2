import { Router, Response } from 'express';
import { ProjectModel, CreateProjectInput } from '../models/Project';
import { TaskModel } from '../models/Task';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const projects = ProjectModel.findByOwnerId(req.user.id);
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const project = ProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const { name, description }: CreateProjectInput = req.body;

    if (!name) {
      res.status(400).json({ message: 'Project name is required' });
      return;
    }

    const project = ProjectModel.create({
      name,
      description,
      owner_id: req.user.id
    });

    res.status(201).json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const project = ProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const { name, description, status } = req.body;

    const VALID_STATUSES = ['active', 'archived', 'completed'];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const updated = ProjectModel.update(req.params.id, { name, description, status });
    res.json({ project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const project = ProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    ProjectModel.delete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/:id/tasks', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  try {
    const project = ProjectModel.findById(req.params.id);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    if (project.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const tasks = TaskModel.findByProjectId(req.params.id);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
