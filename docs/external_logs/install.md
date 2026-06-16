# Installation Guide

## Prerequisites
- **Node.js**: v18 or higher (tested with v24.14.1)
- **npm**: Comes with Node.js (v10+)
- **Web Browser**: Chrome, Firefox, Edge, or Safari (latest)
- **OS**: Windows, macOS, or Linux

---

## Quick Setup (Recommended)

From the project root:

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install All Project Dependencies
```bash
npm run install:all
```

### 3. Configure Environment Variables
Create `backend/.env`:

```env
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

# Default accounts
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

### 4. Inject Default Users
```bash
npm run inject:user
```
This creates 3 default accounts (support, manager, member) from your `.env` file.

### 5. Build the Project
```bash
npm run build
```
This runs `build:frontend` (Vite bundles TypeScript + HTML) then `build:backend` (tsc compiles to `backend/dist/`).

### 6. Start Development Server
```bash
npm run dev
```
Starts both services concurrently:
- **Backend** (Express, port 3000) via nodemon with hot-reload
- **Frontend** (Vite, port 5173) with HMR

Open `http://localhost:5173` in your browser.

---

## Step-by-Step Manual Setup

### Backend

```bash
cd backend
npm install
```

Dependencies installed:
- express (web framework)
- sql.js (SQLite — pure JS, no native compilation)
- jsonwebtoken (JWT auth)
- bcryptjs (password hashing)
- cors (cross-origin)
- dotenv (environment variables)
- uuid (ID generation)
- doT (SSR templates — legacy)
- TypeScript and type definitions

Configure `.env` as shown above, then:

```bash
npm run build   # compile TypeScript
npm start       # runs backend/dist/server.js
```

The backend starts on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run build   # Vite bundles all pages
```

Vite produces:
- `dist/assets/` — compiled JS + CSS per entry point
- `dist/manifest.json` — build manifest

6 entry points: login, dashboard, projects, tasks, settings, team.

In development, the backend serves frontend files from `frontend/dist/` if they exist, otherwise Vite dev server handles them.

---

## Development Mode (Hot Reload)

```bash
# From project root
npm run dev
```

- Backend: `nodemon` watches `backend/src/` for changes, restarts automatically
- Frontend: Vite dev server with HMR at `localhost:5173`
- API proxy: Vite forwards `/api/*` to `localhost:3000`

---

## Production Mode

```bash
npm run build                  # build frontend + backend
NODE_ENV=production npm start  # runs backend/dist/server.js
```

For production deployment:
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET` (32+ characters)
3. Consider a reverse proxy (nginx) for SSL
4. Use process manager:

```bash
npm install -g pm2
pm2 start backend/dist/server.js --name spmp
```

---

## Accessing the Application

| Environment | Frontend URL | API URL |
|------------|-------------|---------|
| Development | `http://localhost:5173` | `http://localhost:3000/api` |
| Production | `http://localhost:3000` | `http://localhost:3000/api` |

### Test Accounts (after `npm run inject:user`)

| Email | Password | Role |
|-------|----------|------|
| support@test.com | support123 | Support |
| manager@test.com | manager123 | Manager |
| member@test.com | member123 | Member |

---

## Database

- **Engine**: SQLite via `sql.js` (pure JavaScript, no native modules)
- **Location**: `backend/data/spmp.db`
- **Persistence**: Auto-saved to disk on each `run()` call
- **Reset**: Delete the file and restart — schema is auto-created

```bash
rm backend/data/spmp.db
npm run dev   # recreates with fresh schema
```

### Tables
- `users` — id, name, email, password_hash, role, timestamps
- `projects` — id, name, description, owner_id, status, timestamps
- `tasks` — id, title, description, project_id, assigned_to, status, priority, due_date, tags, estimated_hours, timestamps
- `time_entries` — id, task_id, user_id, description, hours, date, timestamps
- `sessions` — id, user_id, csrf_token, ip_address, user_agent, expires_at, last_seen_at, timestamps

---

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in .env:
# PORT=3001
```

### Database Issues
If you see "no such table" errors, delete the DB file and restart — it's auto-created with the current schema.

### TypeScript Compilation Errors
```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx vite build
```

### Module Not Found
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

---

## Verifying Installation

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-06-16T..."}

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"manager123"}'
# {"message":"Login successful","token":"...","user":{...}}
```

---

## Architecture Notes

- **No ORM** — raw SQL via `sql.js` with helpers `query()`, `queryOne()`, `run()`
- **No frontend framework** — vanilla TypeScript with Vite bundling
- **Auth**: Session cookie (HttpOnly) + JWT + CSRF token (custom header)
- **SSR**: Legacy doT templates for dashboard pages — migration to static HTML in progress
- **i18n**: Built-in system with 4 language dictionaries in `frontend/src/i18n.ts`
- **Charts**: Native SVG rendering (no Chart.js dependency)
- **HTTP**: Native `fetch()` + `innerHTML` for dynamic content (no HTMX)
