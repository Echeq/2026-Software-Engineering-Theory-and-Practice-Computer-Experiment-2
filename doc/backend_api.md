# Backend API Design

## Overview
RESTful API for SPMP built with Express.js + TypeScript + SQLite (sql.js). Auth: session cookies + JWT + CSRF tokens.

## Base URL
- Dev: `http://localhost:3000/api`
- Prod: `http://<host>:3000/api`

## Authentication
- Sessions stored in DB with 24h TTL
- Session ID: HttpOnly cookie (`sessionId`)
- CSRF token: cookie (`csrf-token`) + header (`X-CSRF-Token`) on non-GET requests

---

## Endpoints

### Authentication (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Login, creates session + CSRF cookie |
| POST | `/register` | No | **Disabled** (403) — use Team page |
| GET | `/me` | Token | Current user profile |
| POST | `/change-password` | Token | Change password (min 6 chars, no reuse) |
| POST | `/logout` | No | Clear session |

### Projects (`/api/projects`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | Any | List projects (member: assigned; manager/support: owned) |
| GET | `/fragment/cards` | Any | HTML fragment for project cards |
| GET | `/:id` | Any | Get project |
| POST | `/` | Manager/Support | Create project |
| PUT | `/:id` | Manager/Support | Update project |
| PATCH | `/:id/close` | Manager/Support | Close (status=completed) |
| PATCH | `/:id/reopen` | Manager/Support | Reopen (status=active) |
| DELETE | `/:id` | Manager/Support | Delete project + tasks |
| POST | `/:id/transfer` | Manager/Support | Transfer ownership |

### Tasks (`/api/tasks`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/my-tasks` | Any | Assigned tasks |
| GET | `/:id` | Any | Get task |
| POST | `/` | Manager/Support | Create task |
| PUT | `/:id` | Manager/Support | Update all fields |
| PUT | `/:id` | Member | Update status only |
| DELETE | `/:id` | Manager/Support | Delete task |

### Users (`/api/users`)

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | `/` | Manager/Support | List all users |
| POST | `/` | Manager | Create user |
| DELETE | `/:id` | Manager | Delete user |
| POST | `/:id/change-role` | Support | Change user role |

### Time Entries (`/api/time-entries`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/task/:taskId` | List entries for task |
| POST | `/` | Create entry |
| DELETE | `/:id` | Delete own entry |

### Health (`/api/health`)

| Method | Path | Response |
|--------|------|----------|
| GET | `/` | `{ status: "ok", timestamp }` |

---

## Response Formats

### Success
```json
{ "message": "...", "project": {...} }
{ "projects": [...] }
```

### Error
```json
{ "message": "Error description" }
```

### Status Codes
200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Server Error

---

## Object Schemas

### User
```json
{ "id": "uuid", "name": "string", "email": "string", "role": "member|manager|support", "created_at": "date", "updated_at": "date" }
```

### Project
```json
{ "id": "uuid", "name": "string", "description": "string|null", "owner_id": "uuid", "status": "active|completed", "created_at": "date", "updated_at": "date" }
```

### Task
```json
{ "id": "uuid", "title": "string", "description": "string|null", "project_id": "uuid", "assigned_to": "uuid|null", "status": "pending|in-progress|completed", "priority": "low|medium|high", "due_date": "date|null", "tags": "string(JSON)", "estimated_hours": "number", "created_at": "date", "updated_at": "date" }
```

### TimeEntry
```json
{ "id": "uuid", "task_id": "uuid", "user_id": "uuid", "description": "string", "hours": "number", "date": "date", "created_at": "date" }
```

---

## Security
- bcrypt (10 salt rounds)
- Session TTL: 24h
- CSRF on all state-changing requests
- Parameterized queries (no SQL injection)
- Role middleware: requireSoporte(), requireManager(), requireSupervisor()
- XSS: escapeHtml() helper
