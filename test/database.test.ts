jest.mock('../backend/src/database', () => jest.requireActual('../test/db'));

import { getTestDb, closeTestDb } from './db';

describe('Database', () => {
  beforeAll(async () => { await getTestDb(); });
  afterAll(() => { closeTestDb(); });

  test('all tables are created on init', async () => {
    const db = await getTestDb();
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tables = result[0]?.values.map((r: any) => r[0]) ?? [];
    expect(tables).toContain('users');
    expect(tables).toContain('projects');
    expect(tables).toContain('tasks');
    expect(tables).toContain('sessions');
    expect(tables).toContain('time_entries');
  });

  test('insert and query round-trip', async () => {
    const { query, run } = require('../backend/src/database');
    run("INSERT INTO users (id, name, email, password_hash, role) VALUES ('x', 'X', 'x@t.com', 'h', 'member')");
    const rows = query('SELECT id, name, email FROM users WHERE id = ?', ['x']);
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('X');
  });

  test('queryOne returns first result only', async () => {
    const { run, queryOne } = require('../backend/src/database');
    run("INSERT INTO users (id, name, email, password_hash, role) VALUES ('a', 'A', 'a@t.com', 'h', 'member')");
    run("INSERT INTO users (id, name, email, password_hash, role) VALUES ('b', 'B', 'b@t.com', 'h', 'member')");
    const one = queryOne('SELECT * FROM users ORDER BY id');
    expect(one.id).toBe('a');
  });

  test('queryOne returns null when no results', async () => {
    const { queryOne } = require('../backend/src/database');
    expect(queryOne('SELECT * FROM users WHERE id = ?', ['none'])).toBeNull();
  });

  test('run throws on invalid SQL', async () => {
    const { run } = require('../backend/src/database');
    expect(() => run('INSERT INTO nonexistent (id) VALUES (?)', ['x'])).toThrow();
  });
});
