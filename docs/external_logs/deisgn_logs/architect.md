# Architecture and Class Design

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌───────────────────────────────────────────┐  │
│  │         Vite Dev Server (5173)            │  │
│  │  HTML + CSS + TS → fetch() /api/*        │  │
│  └──────────────────┬────────────────────────┘  │
│                     │ Proxy (/api → :3000)      │
├─────────────────────┼───────────────────────────┤
│                     ▼                           │
│  ┌───────────────────────────────────────────┐  │
│  │         Express Backend (3000)            │  │
│  │                                           │  │
│  │  Middleware: cors → json → csrf → auth    │  │
│  │                                           │  │
│  │  Routes:                                 │  │
│  │    /api/auth        ── AuthController     │  │
│  │    /api/projects    ── ProjectController  │  │
│  │    /api/tasks       ── TaskController     │  │
│  │    /api/users       ── UserController     │  │
│  │    /api/time-entries─ TimeEntryController │  │
│  │    /api/health      ── HealthCheck        │  │
│  │                                           │  │
│  │  Models (static classes):                │  │
│  │    UserModel, ProjectModel, TaskModel,    │  │
│  │    SessionModel, TimeEntryModel           │  │
│  │                                           │  │
│  │  DB: sql.js (SQLite in memory + file)     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Pattern: Layered (Route → Middleware → Model → Database)

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | Vanilla TypeScript + Vite | No framework overhead; Vite provides HMR, bundling, and TypeScript support natively |
| **Backend** | Express.js + TypeScript | Mature, lightweight framework; TypeScript adds type safety |
| **Database** | SQLite (via sql.js) | Zero-config, file-based, pure JS (no native compilation issues) |
| **Auth** | JWT + Sessions + CSRF | Stateless tokens with server-side session invalidation capability |
| **Templates** | doT (legacy, migrating) | Minimal SSR for dashboard pages; being replaced by static HTML |
| **Charts** | Native SVG | Zero dependencies, lightweight, exact control over rendering |
| **i18n** | Custom built-in | Lightweight, no external i18n library needed for 4 languages |

---

## Class Design

### Backend Models (static classes wrapping SQL)

#### UserModel (`backend/src/models/User.ts`)
- **Attributes**: id, name, email, password_hash, role, created_at, updated_at
- **Methods**:
  - `create(input)` — hash password, insert user
  - `findById(id)` / `findByEmail(email)` — lookup
  - `verifyPassword(password, hash)` — bcrypt compare
  - `updateRole(id, role)` — change role (support only)
  - `updatePassword(id, password)` — rehash + update
  - `delete(id)` — cascade unassign tasks + delete sessions
  - `listAll()` — all users without password_hash

#### ProjectModel (`backend/src/models/Project.ts`)
- **Attributes**: id, name, description, owner_id, status, created_at, updated_at
- **Methods**:
  - `create(input)` — insert project
  - `findById(id)` / `findByOwnerId(ownerId)` — lookup
  - `update(id, updates)` — partial update
  - `delete(id)` — cascade delete tasks + time entries
  - `listAll()` — all projects

#### TaskModel (`backend/src/models/Task.ts`)
- **Attributes**: id, title, description, project_id, assigned_to, status, priority, due_date, tags, estimated_hours, created_at, updated_at
- **Methods**:
  - `create(input)` — insert task
  - `findById(id)` / `findByProjectId(projectId)` / `findByAssignedTo(userId)` — lookup
  - `update(id, updates)` — partial update (member restricted to status)
  - `delete(id)` — cascade delete time entries
  - `listAll()` — all tasks

#### SessionModel (`backend/src/models/Session.ts`)
- **Attributes**: id, user_id, csrf_token, ip_address, user_agent, expires_at, last_seen_at, created_at
- **Methods**:
  - `create(input)` — insert session with 24h expiry
  - `findActiveById(id)` — find non-expired session
  - `touch(id)` — update last_seen_at
  - `deleteByUserId(userId)` — invalidate all user sessions
  - `deleteExpired()` — cleanup expired sessions

#### TimeEntryModel (`backend/src/models/TimeEntry.ts`)
- **Attributes**: id, task_id, user_id, description, hours, date, created_at
- **Methods**: CRUD operations

### Frontend Modules (vanilla TypeScript per page)

Each page module follows a consistent pattern:
```
setupEventListeners()    // Attach DOM events
initializeTheme()        // Apply saved theme
initializeLanguage()     // Apply saved language
handleLogout()           // Clear session, redirect
```

Key modules:
- **login.ts**: Auth flow, token storage, redirect
- **dashboard.ts**: Project cards, task list, charts, search/filter
- **projects.ts**: Project grid, CRUD with modals, close/reopen/delete
- **tasks.ts**: Task CRUD, assignment, status updates, time entries
- **team.ts**: User list, create/delete users, promote roles
- **settings.ts**: Theme toggle, language selector, password change
- **i18n.ts**: Translation dictionaries (4 languages) + `t()` function
- **charts.ts**: SVG doughnut + bar chart rendering

---

## Data Flow

### Request Pipeline
```
Browser → Vite (dev) → fetch() → Express → Middleware stack
                                              │
                          cors → json → csrf → auth (session check)
                                              │
                                         Route handler
                                              │
                                        Model (SQL query)
                                              │
                                        Response JSON
```

### Authentication Flow
```
1. POST /api/auth/login → validate credentials → create session (DB)
2. Response: JWT token + Set-Cookie: sessionId (HttpOnly) + csrf-token (cookie)
3. Subsequent requests: Authorization: Bearer <jwt> + X-CSRF-Token header
4. Server validates: session exists + not expired + CSRF matches
```

### Security Layers
| Layer | Mechanism |
|-------|-----------|
| Transport | CORS restricted to same-origin (Vite proxy) |
| Auth | JWT + session cookie (HttpOnly, SameSite=Lax) |
| CSRF | Per-session token in cookie + custom header validation |
| SQL Injection | Parameterized queries via `?` placeholders |
| XSS | `escapeHtml()` on user-generated content |
| Role | Middleware: `requireSoporte()`, `requireManager()`, `requireSupervisor()` |

---

## Role-Based Access Control

```
                    ┌──────────┐
                    │  support │  ← Full access (DB/CLI only)
                    └────┬─────┘
                         │ can do everything
                    ┌────▼─────┐
                    │  manager │  ← Can create/edit/delete projects & tasks & users
                    └────┬─────┘
                         │ can create tasks, edit own projects
                    ┌────▼─────┐
                    │  member  │  ← Can view assigned tasks, update status only
                    └──────────┘
```

---

## Database Architecture

- **Engine**: SQLite (sql.js) — in-memory database persisted to file
- **File**: `backend/data/spmp.db`
- **Persistence**: Auto-saved after every `run()` (write) operation
- **No ORM**: Raw SQL with helper functions (`query`, `queryOne`, `run`)
- **Schema Evolution**: `ensureColumnExists()` guards for ALTER TABLE
- **Startup**: Database initialized on server start; tables created if not exist

---

## Build Architecture

```
Frontend (Vite):
  TS source → Vite bundler → dist/assets/{entry}.js + .css
  6 entry points: login, dashboard, projects, tasks, settings, team

Backend (tsc):
  TS source → tsc → dist/server.js
  Static models + routes, no bundling needed
```

The root `package.json` orchestrates both via `concurrently` and `npm-run-all` style scripts.
