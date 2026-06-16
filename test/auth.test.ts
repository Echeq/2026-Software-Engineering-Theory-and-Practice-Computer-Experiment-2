jest.mock('../backend/src/database', () => jest.requireActual('../test/db'));

import { getTestDb, clearTestDb, sqliteDatetime } from './db';
import { SessionModel } from '../backend/src/models/Session';

describe('Auth', () => {
  beforeEach(async () => {
    await getTestDb();
    clearTestDb();
  });

  describe('UserModel', () => {
    test('create inserts a user with hashed password', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'Alice', email: 'alice@test.com', password: 'secret123' });
      expect(user.name).toBe('Alice');
      expect(user.email).toBe('alice@test.com');
      expect(user.role).toBe('member');
      expect(user.password_hash).not.toBe('secret123');
      expect(user.password_hash).toMatch(/^\$2[aby]/);
    });

    test('create rejects duplicate email', async () => {
      const { UserModel } = require('../backend/src/models/User');
      await UserModel.create({ name: 'A', email: 'dup@test.com', password: 'pass123' });
      await expect(
        UserModel.create({ name: 'B', email: 'dup@test.com', password: 'pass456' })
      ).rejects.toThrow();
    });

    test('verifyPassword works correctly', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'A', email: 'a@t.com', password: 'correct' });
      expect(await UserModel.verifyPassword('correct', user.password_hash)).toBe(true);
      expect(await UserModel.verifyPassword('wrong', user.password_hash)).toBe(false);
    });

    test('findByEmail finds existing user', async () => {
      const { UserModel } = require('../backend/src/models/User');
      await UserModel.create({ name: 'A', email: 'findme@test.com', password: 'pass123' });
      const found = UserModel.findByEmail('findme@test.com');
      expect(found).not.toBeNull();
      expect(found!.email).toBe('findme@test.com');
    });

    test('findByEmail returns null for unknown email', () => {
      const { UserModel } = require('../backend/src/models/User');
      expect(UserModel.findByEmail('nobody@test.com')).toBeNull();
    });

    test('findById returns user', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'A', email: 'a@t.com', password: 'p' });
      const found = UserModel.findById(user.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(user.id);
    });

    test('updateRole changes user role', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'A', email: 'a@t.com', password: 'pass123' });
      const updated = UserModel.updateRole(user.id, 'manager');
      expect(updated!.role).toBe('manager');
    });

    test('listAll returns users without password_hash', async () => {
      const { UserModel } = require('../backend/src/models/User');
      await UserModel.create({ name: 'A', email: 'a@t.com', password: 'p1' });
      await UserModel.create({ name: 'B', email: 'b@t.com', password: 'p2' });
      const all = UserModel.listAll();
      expect(all.length).toBe(2);
      expect(all[0]).not.toHaveProperty('password_hash');
    });

    test('updatePassword changes hash', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'A', email: 'a@t.com', password: 'oldpass' });
      await UserModel.updatePassword(user.id, 'newpass');
      const updated = UserModel.findById(user.id)!;
      expect(await UserModel.verifyPassword('newpass', updated.password_hash)).toBe(true);
      expect(await UserModel.verifyPassword('oldpass', updated.password_hash)).toBe(false);
    });

    test('delete removes user', async () => {
      const { UserModel } = require('../backend/src/models/User');
      const user = await UserModel.create({ name: 'A', email: 'a@t.com', password: 'p' });
      UserModel.delete(user.id);
      expect(UserModel.findById(user.id)).toBeNull();
    });
  });

  describe('SessionModel', () => {
    test('create and findActiveById', () => {
      const future = sqliteDatetime(new Date(Date.now() + 86400000));
      const session = SessionModel.create({ user_id: 'u1', expires_at: future, csrf_token: 'tok' });
      expect(session.id).toBeDefined();
      const active = SessionModel.findActiveById(session.id);
      expect(active).not.toBeNull();
      expect(active!.user_id).toBe('u1');
      expect(active!.csrf_token).toBe('tok');
    });

    test('findActiveById returns null for expired session', () => {
      const past = sqliteDatetime(new Date(Date.now() - 60000));
      const session = SessionModel.create({ user_id: 'u1', expires_at: past });
      expect(SessionModel.findActiveById(session.id)).toBeNull();
    });

    test('delete removes session', () => {
      const future = sqliteDatetime(new Date(Date.now() + 86400000));
      const session = SessionModel.create({ user_id: 'u1', expires_at: future });
      SessionModel.delete(session.id);
      expect(SessionModel.findById(session.id)).toBeNull();
    });

    test('touch updates last_seen_at', async () => {
      const future = sqliteDatetime(new Date(Date.now() + 86400000));
      const session = SessionModel.create({ user_id: 'u1', expires_at: future });
      await new Promise(r => setTimeout(r, 1100));
      SessionModel.touch(session.id);
      const updated = SessionModel.findById(session.id)!;
      expect(updated.last_seen_at).not.toBe(session.last_seen_at);
    });

    test('deleteExpired removes only expired sessions', () => {
      const past = sqliteDatetime(new Date(Date.now() - 60000));
      const future = sqliteDatetime(new Date(Date.now() + 86400000));
      const s1 = SessionModel.create({ user_id: 'u1', expires_at: past });
      const s2 = SessionModel.create({ user_id: 'u2', expires_at: future });
      SessionModel.deleteExpired();
      expect(SessionModel.findById(s1.id)).toBeNull();
      expect(SessionModel.findById(s2.id)).not.toBeNull();
    });

    test('deleteByUserId removes all sessions for a user', () => {
      const future = sqliteDatetime(new Date(Date.now() + 86400000));
      SessionModel.create({ user_id: 'u1', expires_at: future });
      SessionModel.create({ user_id: 'u1', expires_at: future });
      SessionModel.create({ user_id: 'u2', expires_at: future });
      SessionModel.deleteByUserId('u1');
      const all = require('../backend/src/database').query('SELECT * FROM sessions');
      expect(all.length).toBe(1);
      expect(all[0].user_id).toBe('u2');
    });
  });
});
