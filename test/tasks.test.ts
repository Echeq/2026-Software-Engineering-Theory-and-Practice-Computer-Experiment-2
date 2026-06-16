jest.mock('../backend/src/database', () => jest.requireActual('../test/db'));

import { getTestDb, clearTestDb, seedUser, seedProject } from './db';
import { TaskModel } from '../backend/src/models/Task';

describe('TaskModel', () => {
  let manager: { id: string };
  let member: { id: string };
  let project: { id: string };

  beforeEach(async () => {
    await getTestDb();
    clearTestDb();
    manager = await seedUser({ role: 'manager', email: 'mgr@t.com' });
    member = await seedUser({ role: 'member', email: 'mem@t.com' });
    project = seedProject({ owner_id: manager.id, name: 'Test Project' });
  });

  test('create inserts a task with defaults', () => {
    const t = TaskModel.create({ title: 'Do something', project_id: project.id });
    expect(t.title).toBe('Do something');
    expect(t.project_id).toBe(project.id);
    expect(t.status).toBe('pending');
    expect(t.priority).toBe('medium');
    expect(t.tags).toBe('[]');
    expect(t.estimated_hours).toBe(0);
  });

  test('create accepts all optional fields', () => {
    const t = TaskModel.create({
      title: 'Full task',
      project_id: project.id,
      assigned_to: member.id,
      priority: 'high',
      due_date: '2026-07-01',
      tags: '["bug"]',
      estimated_hours: 8,
    });
    expect(t.assigned_to).toBe(member.id);
    expect(t.priority).toBe('high');
    expect(t.due_date).toBe('2026-07-01');
    expect(t.tags).toBe('["bug"]');
    expect(t.estimated_hours).toBe(8);
  });

  test('findById returns null for missing task', () => {
    expect(TaskModel.findById('nonexistent')).toBeNull();
  });

  test('findById returns task', () => {
    const t = TaskModel.create({ title: 'T', project_id: project.id });
    const found = TaskModel.findById(t.id);
    expect(found).not.toBeNull();
    expect(found!.title).toBe('T');
  });

  test('findByProjectId returns tasks for a project', () => {
    TaskModel.create({ title: 'T1', project_id: project.id });
    TaskModel.create({ title: 'T2', project_id: project.id });
    const tasks = TaskModel.findByProjectId(project.id);
    expect(tasks.length).toBe(2);
  });

  test('findByProjectId returns empty for project with no tasks', () => {
    expect(TaskModel.findByProjectId('unknown')).toEqual([]);
  });

  test('findByAssignedTo returns assigned tasks', () => {
    TaskModel.create({ title: 'T1', project_id: project.id, assigned_to: member.id });
    TaskModel.create({ title: 'T2', project_id: project.id, assigned_to: manager.id });
    const memTasks = TaskModel.findByAssignedTo(member.id);
    expect(memTasks.length).toBe(1);
    expect(memTasks[0].title).toBe('T1');
  });

  test('update changes multiple fields', () => {
    const t = TaskModel.create({ title: 'Old', project_id: project.id });
    const updated = TaskModel.update(t.id, { title: 'Updated', status: 'completed', priority: 'high' });
    expect(updated!.title).toBe('Updated');
    expect(updated!.status).toBe('completed');
    expect(updated!.priority).toBe('high');
  });

  test('update only changes provided fields', () => {
    const t = TaskModel.create({ title: 'T', project_id: project.id, priority: 'low' });
    TaskModel.update(t.id, { status: 'in-progress' });
    const updated = TaskModel.findById(t.id)!;
    expect(updated.status).toBe('in-progress');
    expect(updated.priority).toBe('low');
  });

  test('delete removes task', () => {
    const t = TaskModel.create({ title: 'Delete me', project_id: project.id });
    TaskModel.delete(t.id);
    expect(TaskModel.findById(t.id)).toBeNull();
  });
});
