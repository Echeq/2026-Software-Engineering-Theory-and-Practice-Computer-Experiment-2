import { Router, Response } from 'express';
import { ProjectModel, CreateProjectInput } from '../models/Project';
import { TaskModel } from '../models/Task';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all projects for the authenticated user
router.get('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const projects = ProjectModel.findByOwnerId(req.user.id);
  res.json({ projects });
});

// Get a single project by ID
router.get('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const project = ProjectModel.findById(req.params.id);

  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  // Check ownership
  if (project.owner_id !== req.user.id) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  res.json({ project });
});

// Create a new project
router.post('/', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

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
});

// Update a project
router.put('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const project = ProjectModel.findById(req.params.id);

  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  if (project.owner_id !== req.user.id) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  const updated = ProjectModel.update(req.params.id, req.body);
  res.json({ project: updated });
});

// Delete a project
router.delete('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

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
});

// Get tasks for a project
router.get('/:id/tasks', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

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
});

export default router;
