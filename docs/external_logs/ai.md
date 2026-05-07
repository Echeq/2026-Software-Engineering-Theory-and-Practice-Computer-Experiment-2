# AI Usage Log

## Overview
This document records significant interactions with AI tools during the SPMP project development, including prompts, outputs, issues, and human iterations.

## Module 1: Requirements Analysis

### Interaction 1: Generating User Stories
- **Prompt:** "Generate user stories for a Student Project Management Platform (SPMP) with features for user management, project management, task management, task assignment, status tracking, and optional comments."
- **AI Output Summary:** Generated comprehensive user stories covering registration, login, project CRUD, task creation, assignment, status updates, and filtering.
- **Issues Identified:** Initial output lacked specific acceptance criteria for password validation and project ownership constraints.
- **Human Iteration/Optimization:** Added explicit security requirements (password min 6 chars, JWT authentication) and refined stories to include edge cases like duplicate email handling.

### Interaction 2: Refining Use Cases
- **Prompt:** "Create detailed use case scenarios for user registration and login flows in SPMP, including main flow, alternative flows, and error conditions."
- **AI Output Summary:** Provided structured use cases with preconditions, main flows, alternative flows, and postconditions for both registration and login.
- **Issues Identified:** Missing validation steps for email format and password strength in the main flow.
- **Human Iteration:** Enhanced use cases to include client-side and server-side validation steps, added rate limiting considerations.

## Module 2: Design

### Interaction 3: Database Schema Design
- **Prompt:** "Design an SQLite database schema for a project management system with users, projects, and tasks. Include foreign keys and timestamps."
- **AI Output Summary:** Generated SQL schema with three tables (users, projects, tasks) including proper relationships, CASCADE deletes, and timestamp fields.
- **Issues Identified:** Initial schema didn't include task priority field or due_date column.
- **Human Iteration:** Added priority (low/medium/high) and due_date fields to tasks table, refined foreign key constraints.

### Interaction 4: API Endpoint Design
- **Prompt:** "Design RESTful API endpoints for a project management platform with authentication, projects, and tasks resources."
- **AI Output Summary:** Created comprehensive API documentation with endpoints for auth (/register, /login, /me), projects (CRUD), and tasks (CRUD with assignment).
- **Issues Identified:** Missing authorization checks in endpoint descriptions.
- **Human Iteration:** Added JWT authentication requirements to all protected routes, specified ownership validation for project/task operations.

## Module 3: Implementation

### Interaction 5: Backend Architecture Setup
- **Prompt:** "Create a Node.js Express TypeScript backend structure with SQLite database, JWT authentication, and modular routing for a project management app."
- **AI Output Summary:** Generated complete folder structure with src/database, src/models, src/routes, src/middleware directories, plus package.json and tsconfig.json configurations.
- **Issues Identified:** Initial suggestion used better-sqlite3 which had compatibility issues with Node.js v24.
- **Human Iteration:** Switched to sql.js (pure JavaScript SQLite implementation) to avoid native compilation issues, updated all model files accordingly.

### Interaction 6: Frontend TypeScript Conversion
- **Prompt:** "Convert vanilla JavaScript login/signup forms to TypeScript with proper type annotations and API integration."
- **AI Output Summary:** Provided TypeScript versions of login.ts and signup.ts with interfaces for API responses, typed event handlers, and async/await patterns.
- **Issues Identified:** TypeScript compiler treated all files as single module causing duplicate identifier errors.
- **Human Iteration:** Added `export {}` to each file to make them separate modules, changed tsconfig module setting to "none" for browser compatibility.

### Interaction 7: Dashboard UI Development
- **Prompt:** "Create a responsive dashboard HTML/CSS/TypeScript page for managing projects and tasks with modals for creation forms."
- **AI Output Summary:** Generated complete dashboard.html with project cards grid, task list, modal forms for creating projects and tasks, and responsive CSS.
- **Issues Identified:** Initial design lacked task status update functionality.
- **Human Iteration:** Added inline status dropdown selectors for quick task status updates, implemented priority badges with color coding.

### Interaction 8: Debugging Database Issues
- **Prompt:** "Fix 'better-sqlite3 compilation error with Node.js v24' - C++20 requirement issue."
- **AI Output Summary:** Suggested updating better-sqlite3 version or switching to alternative SQLite library.
- **Issues Identified:** better-sqlite3 v9.x incompatible with Node.js v24's C++ requirements.
- **Human Iteration:** Replaced better-sqlite3 with sql.js, rewrote database helper functions to use async initialization and file-based persistence.

## Module 4: Testing

### Interaction 9: API Testing Strategy
- **Prompt:** "How to test REST API endpoints for authentication and CRUD operations using curl commands?"
- **AI Output Summary:** Provided curl examples for POST /api/auth/register, POST /api/auth/login, and authenticated requests with Bearer tokens.
- **Issues Identified:** Needed to extract and reuse JWT token across multiple requests.
- **Human Iteration:** Manually copied token from login response, created sequential test script demonstrating full workflow (register -> login -> create project).

## Summary of AI Contributions
- **Code Generation:** ~60% of boilerplate code (models, routes, TypeScript interfaces)
- **Architecture Design:** Folder structure, separation of concerns, middleware patterns
- **Debugging:** Identified dependency compatibility issues, suggested alternatives
- **Documentation:** API endpoint specifications, use case templates

## Human Contributions
- **Security Implementation:** JWT strategy, password hashing, input validation
- **Database Migration:** Switched from better-sqlite3 to sql.js, wrote custom query helpers
- **UI/UX Design:** Responsive layout decisions, color schemes, user flow optimization
- **Integration:** Connected frontend to backend, handled CORS, static file serving
- **Testing:** Manual API testing, end-to-end workflow verification
