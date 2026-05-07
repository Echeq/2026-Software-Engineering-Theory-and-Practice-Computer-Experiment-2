# SPMP - Student Project Management Platform

A full-stack web-based project and task management platform built with Node.js, Express, TypeScript, SQLite, and vanilla TypeScript.

## Quick Links

| 📚 Docs | 🔧 API | 🗄️ DB | 🎨 UI | 🏗️ Arch |
|---------|--------|-------|-------|----------|
| [User Guide](./docs/external_logs/user_guid.md) | [Backend API](./docs/external_logs/deisgn_logs/backend_api.md) | [Database](./docs/external_logs/deisgn_logs/db.md) | [UI Design](./docs/external_logs/deisgn_logs/ui_design.md) | [Architecture](./docs/external_logs/deisgn_logs/architect.md) |

---

## 🚀 Easy Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Run the development server
npm run dev
```

Then open **http://localhost:8080** in your browser.

### Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install all dependencies (backend + frontend) |
| `npm run install:backend` | Install backend dependencies only |
| `npm run install:frontend` | Install frontend dependencies only |
| `npm run build:frontend` | Build frontend TypeScript |
| `npm run dev` | Run backend in development mode (auto-reload) |
| `npm run start` | Run backend in production mode |

---

## ⚙️ Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=8080

# Security
JWT_SECRET=your-secret-key-change-in-production

# Environment
NODE_ENV=development
```

> **Note:** A default `.env` file is included in `backend/` with development values.

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
- **No frameworks**: Pure vanilla TypeScript
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
│   │   └── server.ts          # Main entry point
│   ├── dist/                  # Compiled JS
│   ├── data/                  # SQLite database
│   ├── .env                   # Environment config
│   └── package.json
├── frontend/                  # Frontend files
│   ├── src/                   # TypeScript sources
│   ├── js/                    # Compiled JS
│   ├── css/                   # Stylesheets
│   ├── index.html             # Login page
│   ├── signup.html            # Registration
│   ├── dashboard/             # Dashboard pages
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

1. Open browser at **http://localhost:8080**
2. Click "Sign Up" to create an account
3. Login with your credentials
4. Access the dashboard to:
   - Create new projects
   - Add tasks to projects
   - Manage task status and priorities
   - View all projects and assigned tasks

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