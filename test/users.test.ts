jest.mock('../backend/src/database', () => jest.requireActual('../test/db'));

import { getTestDb, clearTestDb, seedUser } from './db';
import { UserModel } from '../backend/src/models/User';

describe('UserModel — listing, roles, delete', () => {
  beforeEach(async () => {
    await getTestDb();
    clearTestDb();
  });

  test('listAll returns all users', async () => {
    await seedUser({ email: 'a@t.com', name: 'A' });
    await seedUser({ email: 'b@t.com', name: 'B' });
    const users = UserModel.listAll();
    expect(users.length).toBe(2);
  });

  test('listAll does not expose password_hash', async () => {
    const user = await seedUser({ email: 'x@t.com', name: 'X' });
    const users = UserModel.listAll();
    const found = users.find((u: any) => u.id === user.id);
    expect(found).not.toHaveProperty('password_hash');
  });

  test('updateRole promotes to manager', async () => {
    const user = await seedUser({ role: 'member' });
    const updated = UserModel.updateRole(user.id, 'manager');
    expect(updated!.role).toBe('manager');
  });

  test('updateRole promotes to support', async () => {
    const user = await seedUser({ role: 'manager' });
    const updated = UserModel.updateRole(user.id, 'support');
    expect(updated!.role).toBe('support');
  });

  test('delete removes user', async () => {
    const user = await seedUser();
    UserModel.delete(user.id);
    expect(UserModel.findById(user.id)).toBeNull();
  });

  test('delete is idempotent on missing user', () => {
    expect(() => UserModel.delete('nonexistent')).not.toThrow();
  });

  test('findById returns null for deleted user', async () => {
    const user = await seedUser();
    UserModel.delete(user.id);
    expect(UserModel.findById(user.id)).toBeNull();
  });

  test('projects survive owner deletion (no cascade)', async () => {
    const { ProjectModel } = require('../backend/src/models/Project');
    const user = await seedUser();
    ProjectModel.create({ name: 'P', owner_id: user.id });
    UserModel.delete(user.id);
    const projects = ProjectModel.findByOwnerId(user.id);
    expect(projects.length).toBe(1);
  });
});
