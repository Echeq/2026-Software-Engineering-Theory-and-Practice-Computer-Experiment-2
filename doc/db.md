# Database Design

## Overview
SQLite database via `sql.js` (pure JavaScript implementation). No ORM — raw SQL with helper functions.

## ER Diagram

```
users 1──N projects        (owner_id)
users 1──N tasks            (assigned_to)
users 1──N time_entries     (user_id)
users 1──N sessions         (user_id)
projects 1──N tasks         (project_id)
tasks 1──N time_entries     (task_id)
```

## Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',  -- 'member' | 'manager' | 'support'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'completed'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    assigned_to TEXT,
    status TEXT NOT NULL DEFAULT 'pending',         -- 'pending' | 'in-progress' | 'completed'
    priority TEXT NOT NULL DEFAULT 'medium',         -- 'low' | 'medium' | 'high'
    due_date TEXT,
    tags TEXT NOT NULL DEFAULT '[]',                 -- JSON array
    estimated_hours REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE time_entries (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    description TEXT,
    hours REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    csrf_token TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Design Decisions

### UUIDs (TEXT primary keys)
All IDs are UUID v4 strings. Safe for distributed scenarios, no collision risk.

### TEXT for dates
SQLite has no native DATETIME; stored as ISO 8601 strings.

### JSON in tasks.tags
Tags stored as JSON array string (e.g., `["bug","urgent"]`). Keeps schema simple.

### Sessions table
Enables server-side invalidation, CSRF per session, 24h TTL, activity tracking via last_seen_at.

### Migration Guards
`ensureColumnExists()` safely adds columns without breaking existing databases.

## Helper Functions

```typescript
query(sql: string, params?: any[]): any[]       -- SELECT → array
queryOne(sql: string, params?: any[]): any|null  -- SELECT → single row
run(sql: string, params?: any[]): void           -- INSERT/UPDATE/DELETE + auto-save
```
