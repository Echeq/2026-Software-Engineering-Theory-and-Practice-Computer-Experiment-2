# SPMP - Student Project Management Platform

A full-stack web-based project and task management platform built with Node.js, Express, TypeScript, SQLite, and vanilla TypeScript. Features role-based access control (support/manager/member), i18n with 4 languages, and session-based authentication with CSRF protection.

## Quick Links

| 📘 User Guide | 📥 Install | 📖 User Manual | 📋 Requirements | 🧪 Test Plan | 📊 Assign |
|:---:|:---:|:---:|:---:|:---:|:---:|
| [user_guid.md](./doc/user_guid.md) | [install.md](./doc/install.md) | [usermanual.md](./doc/usermanual.md) | [requirements.md](./doc/requirements.md) | [test.md](./doc/test.md) | [assign.md](./doc/assign.md) |

| 🏗️ Architecture | 🎨 UI Design | 🔧 API | 🗄️ Database | 📐 Full Design |
|:---:|:---:|:---:|:---:|:---:|
| [architect.md](./doc/architect.md) | [ui_design.md](./doc/ui_design.md) | [backend_api.md](./doc/backend_api.md) | [db.md](./doc/db.md) | [design.md](./doc/design.md) |

| 🤖 AI Log | 📖 User Stories | 🎭 Use Cases | 🌐 i18n | 🧠 Course Skill |
|:---:|:---:|:---:|:---:|:---:|
| [ai.md](./doc/ai.md) | [user_stories.md](./doc/user_stories.md) | [use_cases.md](./doc/use_cases.md) | [EN/ZH/ES/RU](#-internationalization-i18n) | [Course Skill](./skills/software_engineering_course_skill.md) |


---

## Collaborators

| Name | Role |
|------|------|
| **陈昌发** | Project Leader + Documentation + Code Supervision + QA |
| **李欣** | Backend + APIs + Database Design & Management |
| **任杰** | Frontend + UI/UX Design |
| **孔刚** | Frontend Helper + Backend Helper |

---

## Quick Setup

```bash
npm install                  # root deps (concurrently, ts-node)
npm run install:all          # backend/ + frontend/ deps
# edit backend/.env with JWT_SECRET, MANAGER_*, USER_*
npm run inject:user          # seed default users into DB
npm run build                # build:frontend (Vite) then build:backend (tsc)
npm run dev                  # starts backend (port 3000) + frontend (port 5173)
```

## Configuration

Create `backend/.env`:

```env
JWT_SECRET=change-this-secret
NODE_ENV=development

# Default accounts (used by npm run inject:user)
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

Additional users via `USERS_JSON` env var (JSON array).

## Ports

| Service | Port | URL |
|---------|------|-----|
| Vite Frontend (dev) | 5173 | `http://localhost:5173` |
| Backend API | 3000 | `http://localhost:3000/api` |

Vite proxies `/api` requests to the backend, so browse the full app at `localhost:5173`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install backend + frontend dependencies |
| `npm run build` | Build frontend (Vite) then backend (tsc) |
| `npm run dev` | Run backend (nodemon) + frontend (Vite) concurrently |
| `npm run start` | Production: `node backend/dist/server.js` |
| `npm run inject:user` | Insert/upsert default users from `.env` |
| `npm run build:frontend` | Build frontend only |
| `npm run build:backend` | Build backend only |

## Database Reset

```bash
rm backend/data/spmp.db    # delete DB file
npm run dev                 # restart — auto-creates fresh DB
```

---

## Role System

| Role | Permissions |
|------|------------|
| **support** | Full access: CRUD projects/tasks, manage users (create, delete, promote any role), close/reopen/delete projects. Cannot be created via web UI — only via `inject:user` script or DB. |
| **manager** | Create/update/delete projects and tasks, manage team members (create users, delete members), close/reopen projects. |
| **member** | View assigned projects and tasks, update task status only. Cannot create projects or tasks. |

---

## Tech Stack

### Backend
| Component | Library |
|-----------|---------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | SQLite (via sql.js) |
| Auth | JWT + Sessions + CSRF tokens |
| Password | bcryptjs |
| Templates | doT (SSR pages — legacy, migration in progress) |

### Frontend
| Component | Library |
|-----------|---------|
| Build Tool | Vite (6 entry points) |
| Language | TypeScript (vanilla, no framework) |
| i18n | Built-in system (EN/ZH/ES/RU) |
| Charts | Native SVG (no Chart.js) |
| UI | Native fetch + innerHTML (no HTMX) |

---

## Project Structure

```
spmp-platform/
├── backend/
│   ├── src/
│   │   ├── database/        # DB init, schema, query helpers
│   │   ├── middleware/       # readSession, authenticateToken, roleMiddleware
│   │   ├── models/           # User, Project, Task, Session, TimeEntry
│   │   ├── routes/           # auth, projects, tasks, users, timeEntries, pages
│   │   ├── scripts/          # injectUser.ts
│   │   ├── services/         # views.ts, assets.ts, pages.ts (SSR)
│   │   ├── views/            # doT templates (pages/*.dot, partials/*.dot)
│   │   └── server.ts         # Entry point
│   ├── data/                 # SQLite database (spmp.db)
│   ├── dist/                 # Compiled JS
│   └── .env                  # Environment variables
├── frontend/
│   ├── src/                  # TypeScript sources
│   │   ├── i18n.ts           # Translation dictionaries (EN/ZH/ES/RU)
│   │   ├── dashboard.ts      # Dashboard page logic
│   │   ├── projects.ts       # Projects page logic
│   │   ├── tasks.ts          # Tasks page logic
│   │   └── ...
│   ├── dashboard/            # HTML pages (dashboard, projects, tasks, settings, team)
│   ├── dist/                 # Vite build output
│   ├── vite.config.ts        # Vite config with 6 entry points
│   └── index.html            # Login page
├── doc/                       # Documentation (14 reorganized files)
│   ├── user_guid.md           # User guide only
│   ├── install.md             # Installation instructions only
│   ├── usermanual.md          # Install + user guide (combined)
│   ├── test.md                # Test plan, cases, results
│   ├── assign.md              # Task assignment & team tracking
│   ├── ai.md                  # AI interaction log
│   ├── db.md                  # Database design (ER, scripts)
│   ├── backend_api.md         # API definition
│   ├── ui_design.md           # UI design
│   ├── architect.md           # Architecture & class design
│   ├── design.md              # Architecture + UI + API + DB (combined)
│   ├── use_cases.md           # Interaction scenarios
│   ├── user_stories.md        # User stories
│   └── requirements.md        # User stories + use cases (combined)
├── docs/
│   └── external_logs/        # Original course documentation
│       ├── ai.md
│       ├── assign.md
│       └── deisgn_logs/
├── skills/
│   └── software_engineering_course_skill.md
├── package.json              # Root orchestrator
└── README.md
```

---

## API Endpoints

Full documentation: [Backend API Docs](./doc/backend_api.md)

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Login, creates session + CSRF cookie |
| POST | `/register` | No | **Disabled** — use Team page |
| GET | `/me` | Token | Get current user profile |
| POST | `/change-password` | Token | Change password |
| POST | `/logout` | No | Clear session |

### Projects (`/api/projects`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | Any | List user's projects |
| GET | `/fragment/cards` | Any | HTML fragment for project cards |
| GET | `/:id` | Any | Get project details |
| POST | `/` | Manager/Support | Create project |
| PUT | `/:id` | Manager/Support | Update project |
| PATCH | `/:id/close` | Manager/Support | Close project |
| PATCH | `/:id/reopen` | Manager/Support | Reopen project |
| DELETE | `/:id` | Manager/Support | Delete project |
| POST | `/:id/transfer` | Manager/Support | Transfer ownership |

### Tasks (`/api/tasks`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/my-tasks` | Any | Get assigned tasks |
| GET | `/:id` | Any | Get task details |
| POST | `/` | Manager/Support | Create task |
| PUT | `/:id` | Manager/Support | Update task (any field) |
| PUT | `/:id` | Member | Update status only |
| DELETE | `/:id` | Manager/Support | Delete task |

### Users (`/api/users`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | Manager/Support | List all users |
| POST | `/` | Manager | Create user |
| DELETE | `/:id` | Manager | Delete user |
| POST | `/:id/change-role` | Support | Change user role |

---

## Features

### User Management
- Session-based auth with JWT + CSRF tokens
- Role-based access control (support/manager/member)
- Password change with validation
- Team management (create/delete users, promote roles)

### Project Management
- Create, read, update, delete projects
- Close / reopen projects (status: active/completed)
- Transfer project ownership
- Project cards with search/filter
- Visual status badges (active=green, completed=red)

### Task Management
- Create tasks with title, description, priority, due date, tags
- Assign tasks to users
- Task status tracking (pending → in-progress → completed)
- Members can update status only; managers can edit all fields
- Time entry tracking per task
- Charts: project statistics and task overview (native SVG)

### Internationalization
- 4 languages: English (default), Chinese, Spanish, Russian
- Switchable via Settings page
- `data-i18n` / `data-i18n-aria-label` attributes for automatic translation

---

## More Documentation

| File | Description |
|------|-------------|
| [User Guide](./doc/user_guid.md) | How to use the platform |
| [Installation Guide](./doc/install.md) | Setup instructions |
| [User Manual](./doc/usermanual.md) | Install + usage (combined) |
| [Requirements](./doc/requirements.md) | User stories + use cases |
| [Test Plan](./doc/test.md) | Test cases and results |
| [Architecture](./doc/architect.md) | System architecture and classes |
| [API Reference](./doc/backend_api.md) | All REST endpoints |
| [Database Schema](./doc/db.md) | ER diagram and SQL |
| [UI Design](./doc/ui_design.md) | Interface and components |
| [Design (all in one)](./doc/design.md) | Architecture + UI + API + DB |
| [AI Interaction Log](./doc/ai.md) | Prompts and iterations |
| [Task Assignments](./doc/assign.md) | Team member contributions |


---

MIT License
