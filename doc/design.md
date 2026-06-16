# SPMP — Complete Design Document

This document combines Architecture, UI Design, Backend API, and Database Design.

---

## Part 1: Architecture

### System Layout

```
Browser → Vite (5173) → fetch() → Express Backend (3000)
                                       │
                              Middleware: cors → json → csrf → auth
                                       │
                              Routes: auth, projects, tasks, users, time-entries, health
                                       │
                              Models (static): UserModel, ProjectModel, TaskModel, SessionModel
                                       │
                              DB: sql.js (SQLite file: backend/data/spmp.db)
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla TypeScript + Vite |
| Backend | Express + TypeScript |
| Database | SQLite (sql.js) |
| Auth | JWT + Session cookies + CSRF tokens |
| Charts | Native SVG |
| i18n | Custom built-in (EN/ZH/ES/RU) |

### Data Flow

```
Browser → fetch() → Express → cors → json → csrf → auth → Route → Model → SQL → JSON
```

### Security
- CORS (same-origin via Vite proxy)
- JWT + HttpOnly session cookie
- CSRF per session token
- Parameterized queries (SQL injection prevention)
- Role middleware: requireSoporte(), requireManager()
- XSS: escapeHtml() helper

### Role-Based Access Control
- **support**: Full access (can promote any role)
- **manager**: CRUD projects, tasks, users
- **member**: View assigned items, update task status only

---

## Part 2: UI Design

### Pages
1. **Login** — Centered card, email/password form
2. **Registration** — Disabled (403), accounts via Team page
3. **Dashboard** — Sidebar + topbar, greeting, stats, SVG charts, project grid, task list
4. **Projects** — Full-width grid, create/close/reopen/delete, search
5. **Tasks** — Task CRUD, assignment, inline status dropdowns
6. **Settings** — Theme (light/dark), language (EN/ZH/ES/RU), password
7. **Team** — User table, create/promote/delete

### Components
- **Sidebar**: Collapsible, nav links + user footer
- **Project Card**: Status badge, left-border color (green=active, red=completed)
- **Modals**: Focus trap, Escape/backdrop close
- **Badges**: Status (green/red/gray/blue) and Priority (blue/yellow/red)

### Build
- Vite, 6 entry points, proxy `/api` → `:3000`
- Zero runtime dependencies (no React, no Chart.js, no HTMX)

---

## Part 3: Backend API

### Base URL: `http://localhost:3000/api`

### Authentication (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/login` | Login, session + CSRF |
| POST | `/register` | Disabled (403) |
| GET | `/me` | Current user |
| POST | `/change-password` | Change password |
| POST | `/logout` | Clear session |

### Projects (`/api/projects`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | Any | List projects |
| GET | `/fragment/cards` | Any | HTML fragment |
| GET | `/:id` | Any | Get project |
| POST | `/` | Mgr/Supp | Create |
| PUT | `/:id` | Mgr/Supp | Update |
| PATCH | `/:id/close` | Mgr/Supp | Close |
| PATCH | `/:id/reopen` | Mgr/Supp | Reopen |
| DELETE | `/:id` | Mgr/Supp | Delete |
| POST | `/:id/transfer` | Mgr/Supp | Transfer owner |

### Tasks (`/api/tasks`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/my-tasks` | Any | Assigned tasks |
| GET | `/:id` | Any | Get task |
| POST | `/` | Mgr/Supp | Create |
| PUT | `/:id` | Mgr/Supp | Update all |
| PUT | `/:id` | Member | Status only |
| DELETE | `/:id` | Mgr/Supp | Delete |

### Users (`/api/users`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | Mgr/Supp | List users |
| POST | `/` | Manager | Create user |
| DELETE | `/:id` | Manager | Delete user |
| POST | `/:id/change-role` | Support | Change role |

### Time Entries (`/api/time-entries`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/task/:taskId` | List entries |
| POST | `/` | Create entry |
| DELETE | `/:id` | Delete entry |

### Health (`/api/health`)
| Method | Response |
|--------|----------|
| GET | `{ status: "ok", timestamp }` |

---

## Part 4: Database Design

### ER Diagram
```
users 1──N projects (owner_id)
users 1──N tasks (assigned_to)
users 1──N time_entries (user_id)
users 1──N sessions (user_id)
projects 1──N tasks (project_id)
tasks 1──N time_entries (task_id)
```

### SQL Schema

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT NOT NULL,
    assigned_to TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    tags TEXT DEFAULT '[]',
    estimated_hours REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
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
    created_at TEXT DEFAULT (datetime('now')),
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
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Design Decisions
- UUID v4 primary keys (safe for distributed scenarios)
- ISO 8601 timestamps (SQLite has no native DATETIME)
- Tags as JSON array string (no separate table needed)
- Sessions table enables server-side invalidation
- Migration guards: `ensureColumnExists()` for schema evolution
- Helper functions: `query()`, `queryOne()`, `run()` with auto-save
