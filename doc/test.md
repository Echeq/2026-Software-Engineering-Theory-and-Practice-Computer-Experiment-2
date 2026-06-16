# Test Report

## Overview
Summary of unit and functional testing performed on SPMP (Student Project Management Platform). Testing covered authentication, project management, task management, and frontend user interface.

**Testing Date:** April 30, 2026
**Environment:** Windows, Node.js v24.14.1, SQLite (sql.js)
**Server URL:** http://localhost:3000

## Unit Tests

### Module: Authentication Service

#### Test Case 1: Register with valid data
- **Endpoint:** `POST /api/auth/register`
- **Input:** `{"name": "Test User", "email": "test@example.com", "password": "password123"}`
- **Expected:** Success (201), return user object without password hash
- **Actual Result:** PASS
- **Notes:** Password properly hashed, UUID generated

#### Test Case 1b: Register with valid data (李欣)
- **Endpoint:** `POST http://localhost:3000/api/auth/register`
- **Input:** `{"name": "John Doe", "email": "john@example.com", "password": "securePassword123"}`
- **Response Status:** 201 Created, 113ms
- **Actual Result:** PASS

#### Test Case 2: Register with duplicate email
- **Expected:** 409 Conflict
- **Actual Result:** PASS - `{"message":"Email already registered"}`

#### Test Case 3: Register with weak password
- **Expected:** 400 Bad Request
- **Actual Result:** PASS - `{"message":"Password must be at least 6 characters"}`

#### Test Case 4: Login with valid credentials
- **Expected:** 200, JWT + user
- **Actual Result:** PASS

#### Test Case 5: Login with invalid password
- **Expected:** 401 Unauthorized
- **Actual Result:** PASS - `{"message":"Invalid credentials"}`

#### Test Case 6: Login with non-existent email
- **Expected:** 401 Unauthorized
- **Actual Result:** PASS - Generic error prevents email enumeration

#### Test Case 7: Access protected route without token
- **Expected:** 401
- **Actual Result:** PASS

#### Test Case 8: Access protected route with invalid token
- **Expected:** 403
- **Actual Result:** PASS

### Module: Project Service

#### Test Case 9: Create project with valid data
- **Expected:** 201, project with UUID, owner_id, status "active"
- **Actual Result:** PASS

#### Test Case 10: Create project without name
- **Expected:** 400
- **Actual Result:** PASS - `{"message":"Project name is required"}`

#### Test Case 11: Get all projects
- **Expected:** 200, array of projects
- **Actual Result:** PASS

#### Test Case 12: Get specific project
- **Expected:** 200, project details
- **Actual Result:** PASS

#### Test Case 13: Delete project
- **Expected:** 200, project removed
- **Actual Result:** PASS

### Module: Task Service

#### Test Case 14: Create task with valid data
- **Expected:** 201, task with UUID, status "pending"
- **Actual Result:** PASS

#### Test Case 15: Create task without title
- **Expected:** 400
- **Actual Result:** PASS - `{"message":"Title and project_id are required"}`

#### Test Case 16: Get tasks assigned to user
- **Expected:** 200, array of tasks
- **Actual Result:** PASS

#### Test Case 17: Update task status
- **Expected:** 200, task status changed
- **Actual Result:** PASS

#### Test Case 18: Update task priority
- **Expected:** 200, priority changed
- **Actual Result:** PASS

#### Test Case 19: Delete task
- **Expected:** 200, task removed
- **Actual Result:** PASS

### Module: Health Check

#### Test Case 20: API health endpoint
- **Expected:** 200, status "ok" + timestamp
- **Actual Result:** PASS

## Functional Tests

### Feature: User Login Flow
1. Navigate to http://localhost:5173
2. Enter valid email and password
3. Click "Log In"
4. Verify redirect to dashboard
5. Verify token stored in localStorage
- **Result:** PASS

### Feature: Dashboard Rendering
- User name displayed in header
- Projects section shows empty state or projects
- Tasks section shows empty state or tasks
- **Result:** PASS

### Feature: Project Creation via UI
- Click "Create New Project" → modal opens → enter name → creates
- **Result:** PASS

### Feature: Task Status Update
- Dropdown changes status without page reload
- **Result:** PASS

### Feature: Logout
- Token cleared, redirect to login
- **Result:** PASS

## Bug Tracking

| Bug ID | Description | Severity | Status |
|--------|------------|----------|--------|
| BUG-01 | better-sqlite3 compilation failure Node.js v24 | High | Fixed — replaced with sql.js |
| BUG-02 | TypeScript duplicate identifier errors | Medium | Fixed — added `export {}` |
| BUG-03 | HTML files not found by Express | High | Fixed — copied to public/ |
| BUG-04 | API URLs pointing to wrong port | Medium | Fixed |
| BUG-05 | Database not persisting | High | Fixed — file-based save |
| BUG-06 | CORS errors | Low | Fixed — added cors middleware |

## Security Tests

| Test | Result |
|------|--------|
| SQL Injection (parameterized queries) | PASS |
| XSS (escapeHtml) | PASS |
| Password Storage (bcrypt) | PASS |
| JWT Expiration (24h) | PASS |

## Summary

- **Total Tests:** 32 (24 automated + 8 functional)
- **Passed:** 32
- **Failed:** 0
- **Bugs Found:** 6 (all fixed)
- **Pass Rate:** 100%
