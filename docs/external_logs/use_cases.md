# Use Case Interaction Scenarios

## Overview
Detailed interaction scenarios for each user story in the SPMP (Student Project Management Platform), generated and optimized with AI assistance.

## Use Case 1: User Registration
- **Related User Story:** As a new visitor, I want to register an account using my email so that I can access the project management features
- **Actors:** Visitor (User), System
- **Preconditions:** User is on the signup page (http://localhost:5173/signup.html)
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
    10. **Note:** Public registration is currently disabled (403); accounts must be created by a manager via the Team page
- **Postconditions:** (When enabled) User account is created in database, user is redirected to login page

## Use Case 2: User Login
- **Related User Story:** As a registered user, I want to log in with my credentials so that I can access my projects and tasks
- **Actors:** Registered User, System
- **Preconditions:** User has a registered account and is on the login page
- **Main Flow:**
    1. User navigates to login page (http://localhost:5173)
    2. System displays login form with Email and Password fields
    3. User enters their registered email address
    4. User enters their password
    5. User clicks "Log In" button
    6. System validates input fields client-side
    7. System sends POST request to `/api/auth/login` with credentials
    8. System looks up user by email in database, verifies password using bcrypt
    9. System creates session record in DB (24h expiry) with CSRF token
    10. System returns JWT token and user information
    11. System stores token in localStorage, sets session cookie (HttpOnly) and CSRF cookie
    12. System redirects user to dashboard page
- **Alternative Flows:**
    - 6a. If email is empty: System shows "Email is required" error
    - 6b. If password is empty: System shows "Password is required" error
    - 6c. If email format is invalid: System shows "Enter a valid email address" error
    - 8a. If email not found: System returns 401 with generic "Invalid credentials" message
    - 9a. If password incorrect: System returns 401 with generic "Invalid credentials" message
- **Postconditions:** User is authenticated, JWT stored, session created, user redirected to dashboard

## Use Case 3: Create Project
- **Related User Story:** As a manager/support user, I want to create a new project so that I can organize tasks
- **Actors:** Manager/Support User, System
- **Preconditions:** User is logged in with manager or support role
- **Main Flow:**
    1. User clicks "Create New Project" button on dashboard or projects page
    2. System displays modal dialog with project creation form
    3. Form contains: Project Name (required), Description (optional)
    4. User enters project name and optional description, clicks "Create Project"
    5. System validates project name is not empty
    6. System sends POST request to `/api/projects` with project data
    7. System creates project record with UUID, owner_id set to current user, status "active"
    8. System closes modal and refreshes projects list
    9. New project appears as a card in the grid
- **Alternative Flows:**
    - 5a. If project name is empty: System shows validation error, prevents submission
    - 7a. If user is member: System returns 403 "Only managers and soporte can create projects"
- **Postconditions:** Project created, visible on dashboard/projects page

## Use Case 4: View Projects Dashboard
- **Related User Story:** As a logged-in user, I want to view all my projects so that I can manage them
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in and on the dashboard
- **Main Flow:**
    1. User loads dashboard page
    2. System sends GET request to `/api/projects` with JWT token
    3. System queries database: manager/support sees owned projects; member sees assigned projects
    4. System returns projects with task counts
    5. System renders each project as a card in the projects grid
    6. Each card displays: project name, description, status badge (active=green/completed=red), action buttons
    7. If no projects: System displays empty state with contextual message
- **Postconditions:** User sees all their projects in responsive grid

## Use Case 5: Close / Reopen Project
- **Related User Story:** As a manager/support user, I want to close or reopen a project
- **Actors:** Manager/Support User, System
- **Preconditions:** User owns the project and is on the dashboard/projects page
- **Main Flow (Close):**
    1. User locates an active project card
    2. User clicks "Close" button on the card
    3. System displays confirmation dialog
    4. User confirms
    5. System sends PATCH request to `/api/projects/:id/close`
    6. System updates project status to "completed"
    7. Card updates: red left border, red status badge, "Reopen" button appears
- **Main Flow (Reopen):**
    1. User locates a completed project card
    2. User clicks "Reopen" button
    3. System sends PATCH request to `/api/projects/:id/reopen`
    4. System updates project status to "active"
    5. Card updates: green left border, green status badge
- **Postconditions:** Project status toggled between active and completed

## Use Case 6: Delete Project
- **Related User Story:** As a manager/support user, I want to delete a project so that I can remove obsolete projects
- **Actors:** Manager/Support User, System
- **Preconditions:** User owns the project and is on the dashboard/projects page
- **Main Flow:**
    1. User locates a project card
    2. User clicks "Delete" button
    3. System displays confirmation dialog warning about cascading deletion of all tasks
    4. User confirms
    5. System sends DELETE request to `/api/projects/:id`
    6. System deletes project, all its tasks, and all time entries
    7. Project card disappears from grid
- **Postconditions:** Project and all related data permanently deleted

## Use Case 7: Create Task
- **Related User Story:** As a manager/support user, I want to add tasks to a project
- **Actors:** Manager/Support User, System
- **Preconditions:** User is logged in with manager or support role, has at least one project
- **Main Flow:**
    1. User goes to Tasks page
    2. User clicks "Create Task" button
    3. System displays modal with form: Title, Description, Project, Assigned To, Priority, Due Date, Tags, Estimated Hours
    4. User fills in required fields (title + project) and optional fields
    5. User clicks "Create"
    6. System validates input
    7. System sends POST to `/api/tasks`
    8. System creates task with UUID, status "pending"
    9. Task appears in task list
- **Postconditions:** Task created, assignable, visible in task list

## Use Case 8: View and Update Task Status
- **Related User Story:** As a user, I want to view and update task status
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in, has tasks assigned or manages the project
- **Main Flow:**
    1. User views "My Tasks" on dashboard or Tasks page
    2. Each task shows: title, description, priority badge, due date, status dropdown
    3. User clicks status dropdown and selects new status
    4. System sends PUT request to `/api/tasks/:id` with new status
    5. **Member**: can only update `status` field
    6. **Manager/Support**: can update all fields (title, description, priority, etc.)
    7. UI reflects the change immediately
- **Postconditions:** Task status updated in database, UI updated

## Use Case 9: Team Management (Create User)
- **Related User Story:** As a manager/support user, I want to create user accounts
- **Actors:** Manager/Support User, System
- **Preconditions:** User is logged in with manager or support role
- **Main Flow:**
    1. User navigates to Team page
    2. User clicks "Create User"
    3. System displays form: Name, Email, Password, Role (member/manager)
    4. User fills in fields and clicks "Create"
    5. System sends POST to `/api/users`
    6. System validates email uniqueness
    7. System creates user with hashed password
    8. New user appears in the team list
- **Postconditions:** User account created, can log in

## Use Case 10: Team Management (Change Role — Support only)
- **Related User Story:** As a support user, I want to promote or demote users
- **Actors:** Support User, System
- **Preconditions:** User is logged in with support role
- **Main Flow:**
    1. User navigates to Team page
    2. User locates a user in the list
    3. Button text dynamically shows "Promote to Manager" or "Promote to Support" based on current role
    4. User clicks the button
    5. System displays confirmation dialog
    6. User confirms
    7. System sends POST to `/api/users/:id/change-role`
    8. System updates the user's role
    9. Button updates to reflect the new role
- **Postconditions:** User's role changed, permissions updated on next request

## Use Case 11: Settings (Change Password)
- **Related User Story:** As a logged-in user, I want to change my password
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in
- **Main Flow:**
    1. User navigates to Settings page
    2. User fills in current password, new password, confirm new password
    3. User clicks "Change Password"
    4. System validates: current password correct, new password ≥ 6 chars, new ≠ current
    5. System sends POST to `/api/auth/change-password`
    6. System updates password hash in database
    7. System invalidates all other sessions for this user
    8. Success message displayed
- **Postconditions:** Password updated, user stays logged in

## Use Case 12: Logout
- **Related User Story:** As a logged-in user, I want to log out securely
- **Actors:** Authenticated User, System
- **Preconditions:** User is logged in on any protected page
- **Main Flow:**
    1. User clicks "Logout" button in topbar
    2. System sends POST to `/api/auth/logout`
    3. Backend deletes session from database
    4. Frontend clears token from localStorage
    5. User is redirected to login page
- **Postconditions:** Session invalidated, user redirected to login
