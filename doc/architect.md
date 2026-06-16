# Architecture and Class Design

## System Architecture

```
Browser → Vite (5173) → fetch() → Express Backend (3000)
                                       │
                              Middleware: cors → json → csrf → auth
                                       │
                              Routes: auth, projects, tasks, users, time-entries, health
                                       │
                              Models (static): UserModel, ProjectModel, TaskModel, SessionModel
                                       │
                              DB: sql.js (SQLite)
                                       │
                         Tests (Jest 30 + ts-jest)
                              │
                        test/*.test.ts (50 unit tests)
                              │
                        In-memory sql.js database
```

### Pattern: Layered (Route → Middleware → Model → Database)

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Vanilla TS + Vite | No framework overhead, HMR |
| Backend | Express + TypeScript | Mature, type-safe |
| Database | SQLite (sql.js) | Zero-config, pure JS |
| Auth | Session cookies + CSRF | HttpOnly cookies, server-side invalidation |
| Charts | Native SVG | Zero dependencies |
| i18n | Custom built-in | Lightweight for 4 languages |

---

## Class Design

### UserModel
- `create()`, `findById()`, `findByEmail()`, `verifyPassword()`
- `updateRole()`, `updatePassword()`, `delete()`, `listAll()`

### ProjectModel
- `create()`, `findById()`, `findByOwnerId()`, `update()`, `delete()`, `listAll()`

### TaskModel
- `create()`, `findById()`, `findByProjectId()`, `findByAssignedTo()`
- `update()` (member: status only), `delete()`, `listAll()`

### SessionModel
- `create()` (24h expiry), `findActiveById()`, `touch()`, `deleteByUserId()`

### Frontend Modules
- `login.ts` / `dashboard.ts` / `projects.ts` / `tasks.ts` / `team.ts` / `settings.ts`
- `i18n.ts` (4 languages) / `charts.ts` (SVG)
- Pattern: setupEventListeners → initializeTheme → initializeLanguage

---

## Data Flow

### Request Pipeline
```
Browser → fetch() → Express → cors → json → csrf → auth → Route → Model → SQL → JSON response
```

### Auth Flow
1. POST /login → validate → create session (DB) → HttpOnly `sessionId` cookie + CSRF token in response body
2. Subsequent: browser sends `sessionId` cookie automatically + `X-CSRF-Token` header (read from localStorage key `spmp-csrf-token`)
3. Server: validate session exists and is not expired → verify CSRF token matches session

## Security Layers
- CORS (same-origin via Vite proxy)
- Session cookie (HttpOnly, SameSite=Lax)
- CSRF token per session (stored in localStorage, sent via `X-CSRF-Token` header)
- Parameterized queries
- Role middleware: requireSoporte(), requireManager(), requireSupervisor()
- XSS: escapeHtml()

---

## Role-Based Access Control

```
support → manager → member
(support: full access, manager: CRUD all, member: view + status only)
```

## Database Architecture
- SQLite (sql.js), file: `backend/data/spmp.db`
- Auto-save on each `run()`
- No ORM, helpers: `query()`, `queryOne()`, `run()`
- Migration guards: `ensureColumnExists()`

## Build Architecture
- Frontend: Vite (6 entry points → dist/assets/)
- Backend: tsc (src/ → dist/)
- Root package.json orchestrates with concurrently
