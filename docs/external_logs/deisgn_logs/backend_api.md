# Backend API Design

## Overview
RESTful API for SPMP built with Express.js + TypeScript + SQLite (via sql.js). Authentication uses session cookies + JWT + CSRF tokens.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `http://<host>:3000/api`

## Authentication
- Sessions stored in DB with 24-hour TTL
- Session ID sent as HttpOnly cookie (`sessionId`)
- CSRF token stored in cookie (`csrf-token`) and validated via `X-CSRF-Token` header on non-GET requests
- All protected routes require `authenticateToken` middleware

---

## Endpoints

### Authentication (`/api/auth`)

#### `POST /login`
Authenticate user and create session.
- **Body**: `{ email: string, password: string }`
- **Response** (200): `{ message: string, token: string, user: { id, name, email, role } }`
- Sets `sessionId` cookie + `csrf-token` cookie

#### `POST /register` — **Disabled**
Returns 403. Accounts are created via Team management page.

#### `GET /me`
Get current authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200): `{ id, name, email, role }`

#### `POST /change-password`
Change authenticated user's password.
- **Body**: `{ currentPassword: string, newPassword: string }`
- **Validation**: Min 6 chars, cannot match current password
- **Response** (200): `{ message }`

#### `POST /logout`
End current session.
- Reads `sessionId` cookie, deletes session from DB
- **Response** (200): `{ message }`

---

### Projects (`/api/projects`)

All require `Authorization: Bearer <token>` header.

#### `GET /`
List projects for current user.
- **Query params**: `search`, `status`, `lang`
- **Member**: sees projects where assigned to at least one task
- **Manager/Support**: sees owned projects
- **Response** (200): `{ projects: Project[], taskCounts: { [projectId]: number } }`

#### `GET /fragment/cards`
Return HTML fragment of project cards (for dashboard/projects page).
- **Query params**: `search`, `status`, `lang`
- **Headers**: `X-CSRF-Token` required
- **Response** (200): HTML string

#### `GET /:id`
Get single project.
- **Member**: must be assigned a task in the project
- **Manager/Support**: must own the project
- **Response** (200): `{ project }`

#### `POST /`
Create a new project.
- **Role required**: manager or support
- **Body**: `{ name: string, description?: string }`
- **Response** (201): `{ project }`

#### `PUT /:id`
Update project.
- **Role required**: manager or support (must own)
- **Body**: `{ name?, description?, status? }`
- **Response** (200): `{ project }`

#### `PATCH /:id/close`
Close project (set status="completed").
- **Role required**: manager or support (must own)
- **Response** (200): `{ message: string, project }`

#### `PATCH /:id/reopen`
Reopen project (set status="active").
- **Role required**: manager or support (must own)
- **Response** (200): `{ message: string, project }`

#### `DELETE /:id`
Delete project and all associated tasks/time entries.
- **Role required**: manager or support (must own)
- **Response** (200): `{ message }`

#### `POST /:id/transfer`
Transfer project ownership to another user.
- **Role required**: manager or support
- **Body**: `{ newOwnerId: string }`
- **Target user must be**: manager or support
- **Response** (200): `{ message, project }`

#### `GET /:id/tasks`
Get all tasks for a project.
- **Role required**: any authenticated
- **Response** (200): `{ tasks: Task[] }`

---

### Tasks (`/api/tasks`)

#### `GET /my-tasks`
Get tasks assigned to current user.
- **Response** (200): `{ tasks: Task[] }`

#### `GET /:id`
Get single task.
- **Response** (200): `{ task: Task }`

#### `POST /`
Create a task.
- **Role required**: manager or support
- **Body**: `{ title: string, description?: string, project_id: string, assigned_to?: string, priority?: string, due_date?: string, tags?: string, estimated_hours?: number }`
- **Response** (201): `{ task: Task }`

#### `PUT /:id`
Update a task.
- **Manager/Support**: can update all fields
- **Member**: can only update `status` field
- **Body**: `{ title?, description?, status?, priority?, due_date?, assigned_to?, tags?, estimated_hours? }`
- **Response** (200): `{ task: Task }`

#### `DELETE /:id`
Delete a task (cascades to time_entries).
- **Role required**: manager or support
- **Response** (200): `{ message }`

---

### Users (`/api/users`)

#### `GET /`
List all users (without password_hash).
- **Role required**: manager or support
- **Response** (200): `{ users: User[] }`

#### `POST /`
Create a new user account.
- **Role required**: manager
- **Body**: `{ name: string, email: string, password: string, role?: string }`
- **Default role**: member
- **Response** (201): `{ message, user }`

#### `DELETE /:id`
Delete a user.
- **Role required**: manager
- **Cascades**: unassigns tasks, deletes sessions
- **Response** (200): `{ message }`

#### `POST /:id/change-role`
Change a user's role.
- **Role required**: support only
- **Body**: `{ role: string }` — can set to 'member', 'manager', or 'support'
- **Response** (200): `{ message }`

---

### Time Entries (`/api/time-entries`)

#### `GET /task/:taskId`
List time entries for a task.
- **Response** (200): `{ entries: TimeEntry[] }`

#### `POST /`
Create a time entry.
- **Body**: `{ task_id: string, description: string, hours: number, date: string }`
- **Response** (201): `{ entry: TimeEntry }`

#### `DELETE /:id`
Delete own time entry.
- **Response** (200): `{ message }`

---

### Health (`/api/health`)

#### `GET /`
- **Response** (200): `{ status: "ok", timestamp: string }`

---

## Response Formats

### Success
```json
{ "message": "Success message" }
{ "project": { ... } }
{ "projects": [{ ... }] }
```

### Error
```json
{ "message": "Error description" }
```

### Status Codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (wrong role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 500 | Server Error |

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

## Security
- Passwords hashed with bcrypt (10 salt rounds)
- Sessions expire after 24 hours
- CSRF tokens required for state-changing requests
- Parameterized queries prevent SQL injection
- Role middleware enforces access control
- XSS prevention via `escapeHtml()` helper
