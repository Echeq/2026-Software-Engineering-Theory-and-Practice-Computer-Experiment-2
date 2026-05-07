# Test Report

## Overview
Summary of unit and functional testing performed on SPMP (Student Project Management Platform). Testing covered authentication, project management, task management, and frontend user interface.

**Testing Date:** April 30, 2026
**Environment:** Windows, Node.js v24.14.1, SQLite (sql.js)
**Server URL:** http://localhost:8080

## Unit Tests

### Module: Authentication Service

#### Test Case 1: Register with valid data
- **Endpoint:** `POST /api/auth/register`
- **Input:** `{"name": "Test User", "email": "test@example.com", "password": "password123"}`
- **Expected:** Success (201), return user object without password hash
- **Actual Result:** PASS - Returned `{"message":"User created successfully","user":{"id":"...","name":"Test User","email":"test@example.com"}}`
- **Notes:** Password properly hashed, UUID generated for user ID

#### Test Case 1b: Register with valid data (API Tool Testing by 李欣)
- **Tester:** 李欣 performed manual API testing using API client tool
- **Endpoint:** `POST http://localhost:3000/api/auth/register`
- **Input:** 
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response Status:** 201 Created
- **Response Size:** 137 Bytes
- **Response Time:** 113 ms
- **Actual Result:** PASS - Returned user object with UUID, name, and email
```json
{
  "message": "User created successfully",
  "user": {
    "id": "90965a84-93f5-4cc6-b2f8-abec30abab4e",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
- **Evidence:** Screenshot captured showing successful API response in API testing tool (see attachment: api_register_test.png)
- **Notes:** Confirms API works correctly with different test data, UUID generation working, response format matches specification, response time acceptable (113ms includes bcrypt hashing)

#### Test Case 2: Register with duplicate email
- **Endpoint:** `POST /api/auth/register`
- **Input:** `{"name": "Another User", "email": "test@example.com", "password": "password123"}`
- **Expected:** Error 409 Conflict
- **Actual Result:** PASS - Returned `{"message":"Email already registered"}`
- **Notes:** Database UNIQUE constraint working correctly

#### Test Case 3: Register with weak password
- **Endpoint:** `POST /api/auth/register`
- **Input:** `{"name": "User", "email": "user@test.com", "password": "12345"}`
- **Expected:** Error 400, password validation message
- **Actual Result:** PASS - Returned `{"message":"Password must be at least 6 characters"}`

#### Test Case 4: Login with valid credentials
- **Endpoint:** `POST /api/auth/login`
- **Input:** `{"email": "test@example.com", "password": "password123"}`
- **Expected:** Success (200), return JWT token and user info
- **Actual Result:** PASS - Returned token (JWT format) and user object
- **Notes:** Token successfully used for authenticated requests

#### Test Case 5: Login with invalid password
- **Endpoint:** `POST /api/auth/login`
- **Input:** `{"email": "test@example.com", "password": "wrongpassword"}`
- **Expected:** Error 401 Unauthorized
- **Actual Result:** PASS - Returned `{"message":"Invalid credentials"}`

#### Test Case 6: Login with non-existent email
- **Endpoint:** `POST /api/auth/login`
- **Input:** `{"email": "nonexistent@example.com", "password": "password123"}`
- **Expected:** Error 401 Unauthorized
- **Actual Result:** PASS - Returned `{"message":"Invalid credentials"}`
- **Notes:** Generic error message prevents email enumeration

#### Test Case 7: Access protected route without token
- **Endpoint:** `GET /api/projects`
- **Headers:** None
- **Expected:** Error 401 Unauthorized
- **Actual Result:** PASS - Returned `{"message":"Authentication required"}`

#### Test Case 8: Access protected route with invalid token
- **Endpoint:** `GET /api/projects`
- **Headers:** `Authorization: Bearer invalidtoken123`
- **Expected:** Error 403 Forbidden
- **Actual Result:** PASS - Returned `{"message":"Invalid or expired token"}`

### Module: Project Service

#### Test Case 9: Create project with valid data
- **Endpoint:** `POST /api/projects`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"name": "My First Project", "description": "This is a test project"}`
- **Expected:** Success (201), return project object
- **Actual Result:** PASS - Returned project with UUID, owner_id, status "active", timestamps
- **Notes:** Project correctly associated with authenticated user

#### Test Case 10: Create project without name
- **Endpoint:** `POST /api/projects`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"description": "No name project"}`
- **Expected:** Error 400 Bad Request
- **Actual Result:** PASS - Returned `{"message":"Project name is required"}`

#### Test Case 11: Get all projects
- **Endpoint:** `GET /api/projects`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected:** Success (200), return array of user's projects
- **Actual Result:** PASS - Returned `{"projects":[...]}` with previously created project

#### Test Case 12: Get specific project
- **Endpoint:** `GET /api/projects/:id`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected:** Success (200), return project details
- **Actual Result:** PASS - Returned complete project object

#### Test Case 13: Delete project
- **Endpoint:** `DELETE /api/projects/:id`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected:** Success (200), project removed from database
- **Actual Result:** PASS - Returned `{"message":"Project deleted successfully"}`
- **Notes:** Verified project no longer appears in GET /api/projects

### Module: Task Service

#### Test Case 14: Create task with valid data
- **Endpoint:** `POST /api/tasks`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"title": "Test Task", "description": "Task description", "project_id": "<valid_id>", "priority": "high", "due_date": "2026-05-15"}`
- **Expected:** Success (201), return task object
- **Actual Result:** PASS - Returned task with UUID, status "pending", priority "high"

#### Test Case 15: Create task without title
- **Endpoint:** `POST /api/tasks`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"project_id": "<valid_id>"}`
- **Expected:** Error 400 Bad Request
- **Actual Result:** PASS - Returned `{"message":"Title and project_id are required"}`

#### Test Case 16: Get tasks assigned to user
- **Endpoint:** `GET /api/tasks/my-tasks`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected:** Success (200), return array of tasks
- **Actual Result:** PASS - Returned `{"tasks":[...]}`

#### Test Case 17: Update task status
- **Endpoint:** `PUT /api/tasks/:id`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"status": "in-progress"}`
- **Expected:** Success (200), return updated task
- **Actual Result:** PASS - Task status changed from "pending" to "in-progress"

#### Test Case 18: Update task priority
- **Endpoint:** `PUT /api/tasks/:id`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Input:** `{"priority": "low"}`
- **Expected:** Success (200), return updated task
- **Actual Result:** PASS - Priority changed from "high" to "low"

#### Test Case 19: Delete task
- **Endpoint:** `DELETE /api/tasks/:id`
- **Headers:** `Authorization: Bearer <valid_token>`
- **Expected:** Success (200), task removed
- **Actual Result:** PASS - Returned `{"message":"Task deleted successfully"}`

### Module: Health Check

#### Test Case 20: API health endpoint
- **Endpoint:** `GET /api/health`
- **Expected:** Success (200), return status and timestamp
- **Actual Result:** PASS - Returned `{"status":"ok","timestamp":"2026-04-30T..."}`

## Functional Tests

### Feature: User Registration Flow
1. Navigate to http://localhost:8080/signup.html
2. Fill in name, email, password, confirm password
3. Click "Sign Up" button
4. Verify success message appears
5. Verify redirect to login page after 1.5 seconds
- **Result:** PASS
- **Notes:** Form validation works, redirects correctly

### Feature: User Login Flow
1. Navigate to http://localhost:8080
2. Enter valid email and password
3. Click "Log In" button
4. Verify success message appears
5. Verify redirect to dashboard after 1 second
6. Verify JWT token stored in localStorage
- **Result:** PASS
- **Notes:** Token persists across page refreshes

### Feature: Dashboard Rendering
1. Login successfully
2. Verify dashboard loads at http://localhost:8080/dashboard/index.html
3. Verify user name displayed in header
4. Verify "My Projects" section shows empty state or projects
5. Verify "My Tasks" section shows empty state or tasks
- **Result:** PASS
- **Notes:** Responsive layout works on different screen sizes

### Feature: Project Creation via UI
1. On dashboard, click "+ New Project" button
2. Modal opens with form
3. Enter project name and description
4. Click "Create Project"
5. Verify modal closes
6. Verify new project appears in projects grid
- **Result:** PASS
- **Notes:** Form validation prevents empty names

### Feature: Task Creation via UI
1. On project card, click "+ Add Task" button
2. Modal opens with task form
3. Enter task title, select priority, set due date
4. Click "Add Task"
5. Verify modal closes
6. Verify task appears in "My Tasks" section
- **Result:** PASS
- **Notes:** Project ID correctly passed to task creation

### Feature: Task Status Update
1. Locate task in "My Tasks" section
2. Change status using dropdown selector
3. Verify status updates without page reload
- **Result:** PASS
- **Notes:** AJAX request sent successfully

### Feature: Logout
1. Click "Logout" button in header
2. Verify localStorage token cleared
3. Verify redirect to login page
- **Result:** PASS

### Feature: Protected Routes
1. Clear localStorage token manually
2. Try to access dashboard directly
3. Verify redirect to login page
- **Result:** PASS
- **Notes:** Client-side authentication check working

## Bug Tracking

| Bug ID | Description | Severity | Status | Fix Description |
| :--- | :--- | :--- | :--- | :--- |
| BUG-01 | better-sqlite3 compilation failure on Node.js v24 | High | Fixed | Replaced with sql.js (pure JS implementation) |
| BUG-02 | TypeScript duplicate identifier errors in frontend | Medium | Fixed | Added `export {}` to make files separate modules |
| BUG-03 | HTML files not found by Express static middleware | High | Fixed | Copied index.html and signup.html to public/ directory |
| BUG-04 | Frontend API URLs pointing to wrong port | Medium | Fixed | Updated all TS files to use port 8080, rebuilt |
| BUG-05 | Database not persisting between server restarts | High | Fixed | Implemented file-based save in sql.js wrapper |
| BUG-06 | CORS errors when testing API from different origin | Low | Fixed | Enabled cors middleware in Express app |

## Performance Tests

### Response Time Measurements
- **POST /api/auth/register:** ~50-100ms (includes bcrypt hashing)
- **POST /api/auth/login:** ~50-100ms (includes bcrypt comparison)
- **GET /api/projects:** ~5-10ms
- **POST /api/projects:** ~10-20ms
- **GET /api/tasks/my-tasks:** ~5-10ms
- **PUT /api/tasks/:id:** ~10-15ms

### Database Performance
- Initial database creation: ~200ms
- Table initialization: ~50ms
- Single record insert: ~5-10ms
- Query with index (email lookup): ~2-5ms

## Security Tests

### Test Case 21: SQL Injection Prevention
- **Input:** Email field with `' OR '1'='1`
- **Expected:** Treated as literal string, no SQL injection
- **Actual Result:** PASS - Parameterized queries prevent injection

### Test Case 22: XSS Prevention
- **Input:** Project name with `<script>alert('xss')</script>`
- **Expected:** Script tags escaped in frontend display
- **Actual Result:** PASS - Used `escapeHtml()` function in dashboard.ts

### Test Case 23: Password Storage Security
- **Check:** Verify passwords not stored in plaintext
- **Expected:** bcrypt hash in database
- **Actual Result:** PASS - Hash starts with `$2a$10$` (bcrypt format)

### Test Case 24: JWT Token Expiration
- **Check:** Token expiration time
- **Expected:** 24 hours from issuance
- **Actual Result:** PASS - Tokens expire after 24h as configured

## Test Summary

- **Total Test Cases:** 24 + 8 functional tests = 32 tests
- **Passed:** 32
- **Failed:** 0
- **Pass Rate:** 100%
- **Bugs Found:** 6 (all fixed)
- **Security Issues:** 0

## Recommendations

1. **Add Integration Tests:** Consider using Jest or Mocha for automated testing
2. **Load Testing:** Test with multiple concurrent users using tools like Artillery
3. **Accessibility Testing:** Verify WCAG compliance for forms and dashboard
4. **Cross-browser Testing:** Test on Chrome, Firefox, Safari, Edge
5. **Mobile Testing:** Verify responsive design on actual mobile devices

## Conclusion

All core features of SPMP have been thoroughly tested and are functioning correctly. The application successfully handles user authentication, project management, and task management with proper security measures in place. No critical bugs remain unresolved.
