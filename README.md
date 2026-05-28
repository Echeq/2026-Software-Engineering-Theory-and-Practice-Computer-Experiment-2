# SPMP - Student Project Management Platform

A full-stack web-based project and task management platform built with Node.js, Express, TypeScript, SQLite, and vanilla TypeScript.

## Quick Links

| 📚 Docs | 🔧 API | 🗄️ DB | 🎨 UI | 🏗️ Arch |
|---------|--------|-------|-------|----------|
| [User Guide](./docs/external_logs/user_guid.md) | [Backend API](./docs/external_logs/deisgn_logs/backend_api.md) | [Database](./docs/external_logs/deisgn_logs/db.md) | [UI Design](./docs/external_logs/deisgn_logs/ui_design.md) | [Architecture](./docs/external_logs/deisgn_logs/architect.md) |

---

## 🚀 Quick Setup

Follow these steps to get the project running:

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install All Project Dependencies
```bash
npm run install:all
```

### 3. Configure Environment Variables

Create or edit `.env` file in `backend/` directory:

```env
# Security
JWT_SECRET=change-this-secret

# Environment
NODE_ENV=development

# Default Manager Account (for first-time setup)
MANAGER_NAME=System Manager
MANAGER_EMAIL=ur@email.com
MANAGER_PASSWORD=urpassword

# Default Regular User (member role)
USER_NAME=Regular User
USER_EMAIL=user@email.com
USER_PASSWORD=userpassword
```

> **Note:** The backend already includes a `.env.example` file you can copy as a starting point.

### 4. Inject Default Users
```bash
npm run inject:user
```

### 5. Build the Project
```bash
npm run build
```

### 6. Start the Development Server
```bash
npm run dev
```

## 🌐 Ports Information

When the server starts, you'll see two different services running:

- **Vite Frontend**: Runs on port 5173 (shown as `http://localhost:5173` in VITE output)
- **Backend Server**: Runs on port 3000 (shown as `Server running on http://localhost:3000`)

**For testing your .env configuration:** Use the backend server URL (`http://localhost:3000`) as this is where the API runs and where you'll test authentication and environment variables.

The frontend will automatically proxy API requests to the backend, so you can interact with the full application through `http://localhost:5173` in your browser, but the backend API itself is accessible directly at `http://localhost:3000/api`.

## 🧹 Database Reset

If you encounter database issues or want a completely clean slate:

```bash
# Delete the database file
rm backend/data/spmp.db

# Restart the server - it will auto-create a new empty database
npm run dev
```

> **Recommendation:** It's good practice to reset the database when:
> - Starting a new project phase
> - After major schema changes
> - When experiencing unexpected data issues

---

## 📜 Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install all dependencies (backend + frontend) |
| `npm run install:backend` | Install backend dependencies only |
| `npm run install:frontend` | Install frontend dependencies only |
| `npm run build:frontend` | Build frontend TypeScript |
| `npm run build:backend` | Build backend TypeScript |
| `npm run build` | Build both frontend and backend |
| `npm run dev:backend` | Run backend in development mode |
| `npm run dev:frontend` | Run frontend in development mode (Vite) |
| `npm run dev` | Run both backend and frontend concurrently |
| `npm run start` | Run backend in production mode |
| `npm run inject:user` | Inject default users into database |

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (via sql.js)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### Frontend
- **Languages**: HTML5, CSS3, TypeScript
- **Build Tool**: Vite
- **Architecture**: Modular with separate files per page

---

## 📁 Project Structure

```
spmp-platform/
├── backend/                    # Express backend server
│   ├── src/
│   │   ├── database/          # DB init & utilities
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # User, Project, Task models
│   │   ├── routes/            # API routes
│   │   ├── scripts/           # Utility scripts (injectUser.ts)
│   │   └── server.ts          # Main entry point
│   ├── dist/                  # Compiled JS
│   ├── data/                  # SQLite database
│   ├── .env                   # Environment config
│   └── package.json
├── frontend/                  # Frontend files
│   ├── src/                   # TypeScript sources
│   ├── dist/                  # Compiled assets
│   ├── index.html             # Login page
│   ├── signup.html            # Registration
│   ├── vite.config.ts         # Vite configuration
│   └── package.json
├── docs/                      # Documentation
│   └── external_logs/
│       ├── user_guid.md      # User guide
│       ├── use_cases.md      # Use cases
│       ├── use_stories.md    # User stories
│       └── deisgn_logs/
│           ├── backend_api.md
│           ├── db.md
│           ├── ui_design.md
│           └── architect.md
├── package.json              # Root scripts
└── README.md
```

---

## 📋 Features

### 👤 User Management
- User registration with email validation
- Secure login with JWT authentication
- Password hashing with bcrypt
- Session management

### 📂 Project Management
- Create, read, update, delete projects
- Project ownership and access control
- Project status tracking

### ✅ Task Management
- Create tasks within projects
- Assign tasks to users
- Task priority levels (Low, Medium, High)
- Due date setting
- Task status (Pending, In Progress, Completed)
- Filter by project or assigned user

---

## 📖 API Endpoints

Full API documentation: [Backend API Docs](./docs/external_logs/deisgn_logs/backend_api.md)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/me` | Get current user |

### Projects (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/tasks` | Get project tasks |

### Tasks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/my-tasks` | Get assigned tasks |
| GET | `/api/tasks/:id` | Get task details |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## 💻 Usage

1. Open browser at **http://localhost:5173** (frontend)
2. Click "Sign Up" to create an account OR use the injected default users
3. Login with your credentials
4. Access the dashboard to:
   - Create new projects
   - Add tasks to projects
   - Manage task status and priorities
   - View all projects and assigned tasks

---

## 👥 Collaborators

| Name | Role |
|------|------|
| **陈昌发** | Project Leader + Documentation + Code Supervision + QA |
| **李欣** | Backend + APIs + Database Design & Management |
| **任杰** | Frontend + UI/UX Design |
| **孔刚** | Frontend Helper + Backend Helper |

---

## 📚 More Documentation

- [User Guide](./docs/external_logs/user_guid.md)
- [Use Cases](./docs/external_logs/use_cases.md)
- [User Stories](./docs/external_logs/use_stories.md)
- [Architecture](./docs/external_logs/deisgn_logs/architect.md)
- [Database Schema](./docs/external_logs/deisgn_logs/db.md)
- [UI Design](./docs/external_logs/deisgn_logs/ui_design.md)

---

MIT