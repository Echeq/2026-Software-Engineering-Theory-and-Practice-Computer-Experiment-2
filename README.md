# SPMP - Student Project Management Platform

A full-stack web-based project and task management platform built with Node.js, Express, TypeScript, SQLite, and vanilla JavaScript/TypeScript.

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
│   │   ├── database/       # Database initialization and utilities
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/         # Data models (User, Project, Task)
│   │   ├── routes/         # API routes (auth, projects, tasks)
│   │   └── server.ts       # Main server file
│   ├── dist/               # Compiled JavaScript output
│   ├── data/               # SQLite database file (auto-created)
│   ├── package.json
│   └── tsconfig.json
├── public/                  # Frontend files
│   ├── src/                # TypeScript source files
│   │   ├── login.ts
│   │   ├── signup.ts
│   │   └── dashboard.ts
│   ├── js/                 # Compiled JavaScript (auto-generated)
│   ├── css/                # Stylesheets
│   ├── dashboard/          # Dashboard HTML page
│   ├── index.html          # Login page
│   ├── signup.html         # Registration page
│   ├── package.json
│   └── tsconfig.json
└── package.json            # Root package.json for convenience scripts
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
cd ../public
npm install
```

2. **Build the frontend TypeScript:**
```bash
cd public
npm run build
```

3. **Build the backend TypeScript:**
```bash
cd backend
npm run build
```

4. **Start the server:**
```bash
cd backend
npm start
```

The server will start on `http://localhost:8080` (or the port specified in `.env`).

### Development Mode

For development with auto-reload:
```bash
cd backend
npm run dev
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

## Team

- **Elvis**: Project Leader
- **孔刚**: Backend + Database
- **李欣**: Backend + Database + APIs
- **任杰**: Frontend + Testing + Documentation

## License

MIT
