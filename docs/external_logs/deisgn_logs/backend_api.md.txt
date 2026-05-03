# Backend API Design Log

## Overview
The backend API for SPMP is built using Node.js, Express, and TypeScript. It provides RESTful endpoints for user authentication, project management, and task management.

## Technology Stack
- **Runtime**: Node.js v24+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite (via sql.js)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
  - Body: `{ name, email, password }`
  - Response: `{ message, user }`
- `POST /login` - Authenticate user
  - Body: `{ email, password }`
  - Response: `{ message, token, user }`
- `GET /me` - Get current user profile
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

### Projects (`/api/projects`)
- `GET /` - List all projects for current user
- `GET /:id` - Get specific project details
- `POST /` - Create new project
  - Body: `{ name, description? }`
- `PUT /:id` - Update project
  - Body: `{ name?, description?, status? }`
- `DELETE /:id` - Delete project
- `GET /:id/tasks` - Get tasks for a project

### Tasks (`/api/tasks`)
- `GET /my-tasks` - List tasks assigned to current user
- `GET /:id` - Get specific task details
- `POST /` - Create new task
  - Body: `{ title, description?, project_id, priority?, due_date? }`
- `PUT /:id` - Update task
  - Body: `{ title?, description?, status?, priority?, due_date?, assigned_to? }`
- `DELETE /:id` - Delete task

## Security
- All routes except `/auth/register` and `/auth/login` require JWT authentication
- Passwords are hashed using bcrypt with 10 salt rounds
- CORS enabled for cross-origin requests during development

## Database Schema
- **users**: id, name, email, password_hash, created_at, updated_at
- **projects**: id, name, description, owner_id, status, created_at, updated_at
- **tasks**: id, title, description, project_id, assigned_to, status, priority, due_date, created_at, updated_at

## Error Handling
- Standardized error responses with `{ message }` format
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)
