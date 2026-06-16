import initSqlJs, { Database } from 'sql.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

let db: Database | null = null;

export async function getTestDb(): Promise<Database> {
  if (db) return db;
  const SQL = await initSqlJs();
  db = new SQL.Database();
  createSchema(db);
  return db;
}

export function closeTestDb(): void {
  if (db) { db.close(); db = null; }
}

function createSchema(database: Database): void {
  database.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
    owner_id TEXT NOT NULL, status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
    project_id TEXT NOT NULL, assigned_to TEXT,
    status TEXT DEFAULT 'pending', priority TEXT DEFAULT 'medium',
    due_date TEXT, tags TEXT DEFAULT '[]', estimated_hours REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY, task_id TEXT NOT NULL, user_id TEXT NOT NULL,
    description TEXT, hours REAL NOT NULL, date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
  database.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf_token TEXT,
    ip_address TEXT, user_agent TEXT, expires_at TEXT NOT NULL,
    last_seen_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
}

export function clearTestDb(): void {
  if (!db) return;
  db.run('DELETE FROM time_entries');
  db.run('DELETE FROM tasks');
  db.run('DELETE FROM sessions');
  db.run('DELETE FROM projects');
  db.run('DELETE FROM users');
}

// ── Mock replacements for backend/src/database ──

export function query(sql: string, params: any[] = []): any[] {
  if (!db) throw new Error('Test DB not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

export function queryOne(sql: string, params: any[] = []): any | null {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

export function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error('Test DB not initialized');
  db.run(sql, params);
}

export function getDatabase(): Promise<Database> {
  return getTestDb();
}

export function closeDatabase(): void {
  closeTestDb();
}

// ── Date helpers ──

export function sqliteDatetime(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

// ── Seed helpers ──

export async function seedUser(overrides: {
  name?: string; email?: string; role?: string; password?: string;
} = {}): Promise<{ id: string; name: string; email: string; role: string }> {
  const id = uuid();
  const name = overrides.name ?? 'Test User';
  const email = overrides.email ?? `test-${id.slice(0, 8)}@test.com`;
  const role = overrides.role ?? 'member';
  const passwordHash = await bcrypt.hash(overrides.password ?? 'password123', 4);
  run(
    'INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, passwordHash, role],
  );
  return { id, name, email, role };
}

export function seedProject(overrides: {
  name?: string; owner_id: string; status?: string;
}): { id: string; name: string; owner_id: string; status: string } {
  const id = uuid();
  const name = overrides.name ?? 'Test Project';
  run(
    'INSERT INTO projects (id, name, owner_id, status) VALUES (?, ?, ?, ?)',
    [id, name, overrides.owner_id, overrides.status ?? 'active'],
  );
  return { id, name, owner_id: overrides.owner_id, status: overrides.status ?? 'active' };
}

export function seedTask(overrides: {
  title?: string; project_id: string; assigned_to?: string | null;
  status?: string; priority?: string;
}): { id: string; title: string; project_id: string; status: string } {
  const id = uuid();
  const title = overrides.title ?? 'Test Task';
  const status = overrides.status ?? 'pending';
  run(
    'INSERT INTO tasks (id, title, project_id, assigned_to, status, priority) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, overrides.project_id, overrides.assigned_to ?? null, status, overrides.priority ?? 'medium'],
  );
  return { id, title, project_id: overrides.project_id, status };
}
