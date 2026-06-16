jest.mock('../backend/src/database', () => jest.requireActual('../test/db'));

import { getTestDb, clearTestDb, seedUser, seedProject, seedTask } from './db';
import { ProjectModel } from '../backend/src/models/Project';
import { TaskModel } from '../backend/src/models/Task';

describe('ProjectModel', () => {
  let manager: { id: string };
  let member: { id: string };

  beforeEach(async () => {
    await getTestDb();
    clearTestDb();
    manager = await seedUser({ role: 'manager', email: 'mgr@test.com' });
    member = await seedUser({ role: 'member', email: 'mem@test.com' });
  });

  test('create inserts a project', () => {
    const p = ProjectModel.create({ name: 'My Project', owner_id: manager.id });
    expect(p.name).toBe('My Project');
    expect(p.owner_id).toBe(manager.id);
    expect(p.status).toBe('active');
    expect(p.id).toBeDefined();
  });

  test('create assigns defaults for missing fields', () => {
    const p = ProjectModel.create({ name: 'Minimal', owner_id: manager.id });
    expect(p.description).toBeNull();
    expect(p.status).toBe('active');
  });

  test('findById returns null for missing project', () => {
    expect(ProjectModel.findById('nonexistent')).toBeNull();
  });

  test('findById returns project', () => {
    const p = ProjectModel.create({ name: 'P', owner_id: manager.id });
    const found = ProjectModel.findById(p.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('P');
    expect(found!.id).toBe(p.id);
  });

  test('findByOwnerId returns only owned projects', () => {
    ProjectModel.create({ name: 'P1', owner_id: manager.id });
    ProjectModel.create({ name: 'P2', owner_id: member.id });
    const mgrProjects = ProjectModel.findByOwnerId(manager.id);
    expect(mgrProjects.length).toBe(1);
    expect(mgrProjects[0].name).toBe('P1');
  });

  test('findByOwnerId returns empty for user with no projects', () => {
    expect(ProjectModel.findByOwnerId('unknown')).toEqual([]);
  });

  test('update changes project name', () => {
    const p = ProjectModel.create({ name: 'Old', owner_id: manager.id });
    const updated = ProjectModel.update(p.id, { name: 'Updated' });
    expect(updated!.name).toBe('Updated');
  });

  test('update changes status to completed', () => {
    const p = ProjectModel.create({ name: 'P', owner_id: manager.id });
    const updated = ProjectModel.update(p.id, { status: 'completed' });
    expect(updated!.status).toBe('completed');
  });

  test('delete removes project', () => {
    const p = ProjectModel.create({ name: 'ToDelete', owner_id: manager.id });
    ProjectModel.delete(p.id);
    expect(ProjectModel.findById(p.id)).toBeNull();
  });

  test('delete returns true for existing project', () => {
    const p = ProjectModel.create({ name: 'P', owner_id: manager.id });
    expect(ProjectModel.delete(p.id)).toBe(true);
  });

  test('delete does not cascade to tasks', () => {
    const p = ProjectModel.create({ name: 'P', owner_id: manager.id });
    const t = seedTask({ project_id: p.id, title: 'Child task' });
    ProjectModel.delete(p.id);
    expect(TaskModel.findById(t.id)).not.toBeNull();
  });
});
