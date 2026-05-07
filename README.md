# SPMP - Student Project Management Platform

A full-stack web-based project and task management platform built with Node.js, Express, TypeScript, SQLite, and vanilla TypeScript.

## Quick Links

[📁 Backend Docs](./docs/external_logs/deisgn_logs/backend_api.md) · [🗄️ Database Docs](./docs/external_logs/deisgn_logs/db.md) · [🎨 UI Design](./docs/external_logs/deisgn_logs/ui_design.md) · [🏗️ Architecture](./docs/external_logs/deisgn_logs/architect.md)

---

## Easy Start

```bash
# 1. Install all dependencies
npm run install:all

# 2. Run the development server
npm run dev
```

Then open http://localhost:8080 in your browser.

**Available npm scripts:**
- `npm run install:all` - Install all dependencies
- `npm run build:frontend` - Build frontend TypeScript
- `npm run dev` - Run backend in development mode
- `npm run start` - Run backend in production mode

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (using sql.js)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

### Frontend
- **Languages**: HTML5, CSS3, TypeScript
- **No frameworks**: Pure vanilla TypeScript
- **Architecture**: Modular with separate files for each page

## Project Structure

```
├── backend/                 # Backend server
│   ├── src/
│   │   ├── database/        # Database initialization and utilities
│   │   ├── middleware/      # Authentication middleware
│   │   ├── models/          # Data models (User, Project, Task)
│   │   ├── routes/          # API routes (auth, projects, tasks)
│   │   └── server.ts        # Main server file
│   ├── dist/                # Compiled JavaScript output
│   ├── data/                # SQLite database file (auto-created)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Frontend files
│   ├── src/                 # TypeScript source files
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   └── dashboard.ts
│   ├── js/                  # Compiled JavaScript (auto-generated)
│   ├── css/                 # Stylesheets
│   ├── dashboard/           # Dashboard HTML page
│   ├── index.html           # Login page
│   ├── signup.html          # Registration page
│   ├── package.json
│   └── tsconfig.json
├── docs/                    # Documentation
│   └── external_logs/       # Development logs and notes
├── package.json             # Root package.json for convenience scripts
└── README.md
```

## Features

### User Management
- User registration with email validation
- Secure login with JWT authentication
- Password hashing using bcrypt
- Session management

### Project Management
- Create, view, update, and delete projects
- Project ownership and access control
- Project status tracking

### Task Management
- Create tasks within projects
- Assign tasks to users
- Set task priority (Low, Medium, High)
- Set due dates
- Update task status (Pending, In Progress, Completed)
- View tasks by project or assigned user

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (comes with Node.js)

### Quick Start

1. **Install all dependencies:**
```bash
npm run install:all
```

Or install separately:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

2. **Start the server (development mode):**
```bash
npm run dev
```

The server will start on `http://localhost:8080` (or the port specified in `.env`).

### Build & Run Production

```bash
# Build frontend
npm run build:frontend

# Build backend
cd backend
npm run build

# Start production server
cd backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires auth)

### Projects (requires authentication)
- `GET /api/projects` - Get all projects for current user
- `GET /api/projects/:id` - Get a specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project
- `GET /api/projects/:id/tasks` - Get tasks for a project

### Tasks (requires authentication)
- `GET /api/tasks/my-tasks` - Get tasks assigned to current user
- `GET /api/tasks/:id` - Get a specific task
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=8080
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

## Usage

1. Open your browser and navigate to `http://localhost:8080`
2. Create an account by clicking "Sign Up"
3. Login with your credentials
4. You'll be redirected to the dashboard where you can:
   - Create new projects
   - Add tasks to projects
   - Manage task status and priorities
   - View all your projects and assigned tasks

## License

MIT