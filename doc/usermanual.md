# SPMP — Complete User Manual

## Part 1: Installation

### Prerequisites
- Node.js v18+ (tested with v24.14.1)
- npm v10+
- Modern web browser (Chrome, Firefox, Edge, Safari)

### Quick Setup

```bash
npm install
npm run install:all
```

Create `backend/.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
SUPPORT_NAME=Support Admin
SUPPORT_EMAIL=support@test.com
SUPPORT_PASSWORD=support123
MANAGER_NAME=Manager User
MANAGER_EMAIL=manager@test.com
MANAGER_PASSWORD=manager123
USER_NAME=Member User
USER_EMAIL=member@test.com
USER_PASSWORD=member123
```

```bash
npm run inject:user    # Seed default accounts
npm run build          # Build frontend + backend
```

### Run Tests (optional)
```bash
npm test
```
Executes 50 automated unit tests using Jest + ts-jest against an in-memory SQLite database. All tests run in isolation with zero configuration needed.

### Start Development Server
```bash
npm run dev            # Start both backend (3000) and frontend (5173)
```

Open `http://localhost:5173`.

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| support@test.com | support123 | Support (full access) |
| manager@test.com | manager123 | Manager |
| member@test.com | member123 | Member |

### Troubleshooting

- Port conflict: `netstat -ano | findstr :3000; taskkill /PID <PID> /F`
- DB issues: delete `backend/data/spmp.db` and restart
- Module errors: run `npm run install:all` again

---

## Part 2: User Guide

### Accessing the Application
Navigate to `http://localhost:5173` (dev) or `http://localhost:3000` (production).

### Dashboard
After login, the dashboard shows:
- Personalized greeting with role badge
- Project statistics and native SVG charts
- Project cards grid (filterable by All/Active/Completed)
- Search bar for projects
- Assigned tasks with inline status dropdowns

### Roles

| Role | Permissions |
|------|------------|
| Support | Full access to everything |
| Manager | Create/edit/delete projects, tasks, and users |
| Member | View assigned projects, update task status only |

### Managing Projects (Manager/Support)
- **Create**: Click "Create New Project", enter name + optional description
- **Close**: Click "Close" on an active project card → confirm
- **Reopen**: Click "Reopen" on a completed project card → confirm
- **Delete**: Click "Delete" → confirm (cascades to all tasks)

### Managing Tasks (Manager/Support)
- **Create**: Tasks page → "Create Task" → fill title, project, assignee, priority, due date, tags, hours
- **Status**: Use dropdown on any task to change status
- **Delete**: Click delete button on task card

### Task Status Updates (Member)
- Members can only change task status via the dropdown (Pending → In Progress → Completed)
- All other fields are read-only

### Team Management
- **Access**: Team link in sidebar (visible to managers/support)
- **Create User**: Fill name, email, password, select role
- **Change Role** (Support only): Promote/demote users via buttons
- **Delete User**: Remove user, cascades to unassign tasks

### Settings
- **Theme**: Light/dark toggle
- **Language**: EN, ZH (简体中文), ES (Español), RU (Русский)
- **Password**: Change with current + new password

### Logout
Click Logout in the topbar — session is invalidated server-side.

---

## Architecture Notes
- **Backend**: Express + TypeScript + SQLite (sql.js)
- **Frontend**: Vanilla TypeScript + Vite (no frameworks)
- **Auth**: HttpOnly session cookies + CSRF tokens
- **Charts**: Native SVG (no Chart.js)
- **HTTP**: Native fetch (no HTMX)
- **i18n**: Built-in with EN/ZH/ES/RU dictionaries
