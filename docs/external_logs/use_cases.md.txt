# Use Case Interaction Scenarios

## Overview
Detailed interaction scenarios for each user story in the SPMP (Student Project Management Platform), generated and optimized with AI assistance.

## Use Case 1: User Registration
- **Related User Story:** As a new visitor, I want to register an account using my email so that I can access the project management features
- **Actors:** Visitor (User), System
- **Preconditions:** User is on the signup page (http://localhost:8080/signup.html)
- **Main Flow:**
    1. User navigates to signup page by clicking "Sign Up" link from login page
    2. System displays registration form with fields: Full Name, Email, Password, Confirm Password
    3. User enters their full name (minimum 2 characters)
    4. User enters a valid email address
    5. User creates a password (minimum 6 characters)
    6. User confirms password by re-entering it
    7. User clicks "Sign Up" button
    8. System validates all input fields client-side
    9. System sends POST request to `/api/auth/register` with user data
    10. System validates email format and uniqueness server-side
    11. System hashes password using bcrypt (10 salt rounds)
    12. System creates user record in database with UUID
    13. System returns success message with user details (excluding password hash)
    14. System displays success message: "Account created successfully. Redirecting to the login page..."
    15. System redirects user to login page after 1.5 seconds
- **Alternative Flows:**
    - 8a. If any field is empty: System displays inline error messages, prevents submission
    - 8b. If passwords don't match: System shows "Passwords do not match" error under confirm password field
    - 8c. If password is less than 6 characters: System shows "Password must be at least 6 characters" error
    - 8d. If email format is invalid: System shows "Enter a valid email address" error
    - 10a. If email already exists: System returns 409 Conflict, displays "Email already registered" error
    - 13a. If server error occurs: System displays "Sign up failed. Check the data or server status" error
- **Postconditions:** User account is created in database, user is redirected to login page, no automatic login occurs

## Use Case 2: User Login
- **Related User Story:** As a registered user, I want to log in with my credentials so that I can access my projects and tasks
- **Actors:** Registered User, System
- **Preconditions:** User has a registered account and is on the login page
- **Main Flow:**
    1. User navigates to login page (http://localhost:8080)
    2. System displays login form with Email and Password fields
    3. User enters their registered email address
    4. User enters their password
    5. User clicks "Log In" button
    6. System validates input fields client-side
    7. System sends POST request to `/api/auth/login` with credentials
    8. System looks up user by email in database
    9. System verifies password using bcrypt comparison
    10. System generates JWT token with 24-hour expiration
    11. System returns token and user information
    12. System stores token in localStorage
    13. System displays success message: "Login successful. Redirecting to dashboard..."
    14. System redirects user to dashboard page after 1 second
- **Alternative Flows:**
    - 6a. If email is empty: System shows "Email is required" error
    - 6b. If password is empty: System shows "Password is required" error
    - 6c. If email format is invalid: System shows "Enter a valid email address" error
    - 8a. If email not found: System returns 401 with generic "Invalid credentials" message
    - 9a. If password incorrect: System returns 401 with generic "Invalid credentials" message
    - 11a. If server error: System displays "Login failed. Check your credentials or server status"
- **Postconditions:** User is authenticated, JWT token stored in browser, user redirected to dashboard

## Use Case 3: Create Project
- **Related User Story:** As a logged-in user, I want to create a new project so that I can organize my tasks
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in and on the dashboard page
- **Main Flow:**
    1. User clicks "+ New Project" button on dashboard
    2. System displays modal dialog with project creation form
    3. Form contains: Project Name (required), Description (optional)
    4. User enters project name
    5. User optionally enters project description
    6. User clicks "Create Project" button
    7. System validates that project name is not empty
    8. System sends POST request to `/api/projects` with project data and JWT token
    9. System validates authentication token
    10. System creates project record with UUID, owner_id set to current user
    11. System sets default status to "active"
    12. System returns created project object
    13. System closes modal dialog
    14. System refreshes projects list on dashboard
    15. New project appears in projects grid
- **Alternative Flows:**
    - 7a. If project name is empty: System shows alert "Project name is required", prevents submission
    - 9a. If token is invalid/expired: System returns 401, redirects to login page
    - 12a. If server error: System shows alert "Failed to create project", keeps modal open
- **Postconditions:** Project is created in database, associated with current user, visible on dashboard

## Use Case 4: View Projects
- **Related User Story:** As a logged-in user, I want to view all my projects so that I can manage them
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in and on the dashboard page
- **Main Flow:**
    1. User loads dashboard page
    2. System automatically sends GET request to `/api/projects` with JWT token
    3. System validates authentication token
    4. System queries database for projects where owner_id matches current user
    5. System returns array of projects ordered by creation date (newest first)
    6. System renders each project as a card in the projects grid
    7. Each card displays: project name, description (if any), status badge, action buttons
    8. If no projects exist: System displays "No projects yet. Create your first project!" message
- **Alternative Flows:**
    - 3a. If token is missing: System redirects to login page
    - 3b. If token is invalid: System returns 403, redirects to login
    - 5a. If database error: System displays "Failed to load projects. Please refresh the page."
- **Postconditions:** User sees all their projects displayed in responsive grid layout

## Use Case 5: Delete Project
- **Related User Story:** As a project owner, I want to delete a project so that I can remove unwanted projects
- **Actors:** Authenticated User (Project Owner), System
- **Preconditions:** User is logged in, owns the project, and is on the dashboard
- **Main Flow:**
    1. User locates project card in projects grid
    2. User clicks "Delete" button on project card
    3. System displays confirmation dialog: "Are you sure you want to delete this project? This will also delete all its tasks."
    4. User confirms deletion
    5. System sends DELETE request to `/api/projects/:id` with JWT token
    6. System validates authentication and ownership
    7. System deletes project from database (CASCADE deletes associated tasks)
    8. System returns success message
    9. System refreshes projects and tasks lists
    10. Project card disappears from grid
- **Alternative Flows:**
    - 4a. If user cancels: System closes confirmation dialog, no action taken
    - 6a. If user doesn't own project: System returns 403 "Access denied"
    - 7a. If project not found: System returns 404 "Project not found"
    - 8a. If server error: System shows alert "Failed to delete project"
- **Postconditions:** Project and all its tasks are permanently deleted from database

## Use Case 6: Create Task
- **Related User Story:** As a project owner, I want to add tasks to my project so that I can track work items
- **Actors:** Authenticated User (Project Owner), System
- **Preconditions:** User is logged in, owns at least one project, and is on the dashboard
- **Main Flow:**
    1. User locates desired project card in projects grid
    2. User clicks "+ Add Task" button on project card
    3. System displays modal dialog with task creation form
    4. Form contains: Task Title (required), Description (optional), Priority dropdown (Low/Medium/High), Due Date (optional)
    5. User enters task title
    6. User optionally enters description
    7. User selects priority level (default: Medium)
    8. User optionally selects due date using date picker
    9. User clicks "Add Task" button
    10. System validates that title is not empty and project_id is present
    11. System sends POST request to `/api/tasks` with task data and JWT token
    12. System validates authentication and project ownership
    13. System creates task record with UUID, status "pending", assigned_to null
    14. System returns created task object
    15. System closes modal dialog
    16. System refreshes tasks list
    17. New task appears in "My Tasks" section
- **Alternative Flows:**
    - 10a. If title is empty: System shows alert "Task title and project are required"
    - 12a. If project doesn't exist: System returns 404 "Project not found"
    - 12b. If user doesn't own project: System returns 403 "Access denied"
    - 14a. If server error: System shows alert "Failed to create task"
- **Postconditions:** Task is created in database, associated with project, visible in tasks list

## Use Case 7: Update Task Status
- **Related User Story:** As a user, I want to update task status so that I can track progress
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in, has tasks assigned or owns the project, and is on the dashboard
- **Main Flow:**
    1. User locates task in "My Tasks" section
    2. Task displays current status in dropdown selector
    3. User clicks on status dropdown
    4. System shows options: Pending, In Progress, Completed
    5. User selects new status
    6. System automatically sends PUT request to `/api/tasks/:id` with new status
    7. System validates authentication and access rights
    8. System updates task status in database
    9. System updates task's updated_at timestamp
    10. System returns updated task object
    11. UI reflects new status immediately (no page reload)
- **Alternative Flows:**
    - 7a. If user lacks permission: System returns 403, shows alert "Failed to update task status"
    - 7b. If task not found: System returns 404
    - 10a. If network error: System shows alert "Failed to update task status", reverts dropdown to previous value
- **Postconditions:** Task status is updated in database, UI reflects change

## Use Case 8: View Assigned Tasks
- **Related User Story:** As a user, I want to see all tasks assigned to me so that I can manage my workload
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in and on the dashboard page
- **Main Flow:**
    1. User loads dashboard page
    2. System automatically sends GET request to `/api/tasks/my-tasks` with JWT token
    3. System validates authentication token
    4. System queries database for tasks where assigned_to matches current user ID
    5. System returns array of tasks ordered by creation date (newest first)
    6. System renders each task as a list item in "My Tasks" section
    7. Each task displays: title, description (if any), priority badge (color-coded), due date (if set), status dropdown
    8. If no tasks assigned: System displays "No tasks assigned to you." message
- **Alternative Flows:**
    - 3a. If token is invalid: System redirects to login page
    - 5a. If database error: System displays "Failed to load tasks. Please refresh the page."
- **Postconditions:** User sees all tasks assigned to them with visual priority indicators

## Use Case 9: Logout
- **Related User Story:** As a logged-in user, I want to log out so that I can securely end my session
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in and on any protected page
- **Main Flow:**
    1. User clicks "Logout" button in header navigation
    2. System removes JWT token from localStorage
    3. System redirects user to login page (http://localhost:8080)
    4. User arrives at login page, unauthenticated
- **Alternative Flows:**
    - None (simple operation with minimal failure points)
- **Postconditions:** User is logged out, token removed from browser, cannot access protected routes

## Use Case 10: Access Protected Route Without Authentication
- **Related User Story:** As the system, I want to prevent unauthorized access so that user data remains secure
- **Actors:** Unauthenticated User, System
- **Preconditions:** User tries to access dashboard or API without valid token
- **Main Flow:**
    1. User attempts to access dashboard page directly (e.g., bookmarked URL)
    2. Dashboard JavaScript checks for token in localStorage
    3. If token not found: System redirects to login page immediately
    4. If token exists but user makes API request: Frontend sends request with Bearer token
    5. Backend middleware validates token
    6. If token invalid/expired: Backend returns 401 or 403
    7. Frontend receives error, redirects to login page
- **Alternative Flows:**
    - 3a. If token exists and is valid: System allows access to dashboard
    - 6a. If token is valid: System processes API request normally
- **Postconditions:** Unauthorized access prevented, user redirected to login

*(Additional use cases can be added for future features like task comments, team collaboration, etc.)*
