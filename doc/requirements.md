# SPMP — Requirements Document

This document combines User Stories and Use Cases.

---

## Part 1: User Stories

### Story 1: User Registration
- **As a** new visitor, **I want to** register with email and password, **so that** I can access project management features.
- **Acceptance:** Email validation, password ≥ 6 chars, match confirmation, duplicate rejection.

### Story 2: User Login
- **As a** registered user, **I want to** log in with my credentials, **so that** I can access my projects.
- **Acceptance:** Generic error on invalid credentials, HttpOnly session cookie + CSRF token, 24h session expiry.

### Story 3: User Profile Viewing
- **As a** logged-in user, **I want to** see my name on the dashboard, **so that** I can confirm my account.

### Story 4: Create Project
- **As a** manager/support user, **I want to** create a project with name and description, **so that** I can organize tasks.

### Story 5: View Projects
- **As a** user, **I want to** see all projects in a visual grid, **so that** I can overview my work.

### Story 6: Delete Project
- **As a** project owner, **I want to** delete unwanted projects, **so that** I can keep things organized.
- **Acceptance:** Confirmation dialog, cascade delete tasks.

### Story 7: Create Task
- **As a** manager/support user, **I want to** add tasks with title, priority, due date, **so that** I can track work items.

### Story 8: View Assigned Tasks
- **As a** user, **I want to** see all tasks assigned to me, **so that** I can manage my workload.

### Story 9: Update Task Status
- **As a** user, **I want to** change task status, **so that** I can track progress.
- **Acceptance:** Dropdown selector, no page reload.

### Story 10: Update Task Priority
- **As a** project owner, **I want to** change priority level, **so that** I can indicate importance.

### Story 11: Set Task Due Date
- **As a** project owner, **I want to** assign a due date, **so that** team knows deadlines.

### Story 12: Secure Session Management
- **As a** security-conscious user, **I want** sessions to expire, **so that** my account stays secure.

### Story 13: Responsive Dashboard
- **As a** mobile user, **I want to** access the dashboard on my phone, **so that** I can manage on the go.

### Story 14: Input Validation
- **As a** user, **I want** clear error messages, **so that** I can fix issues.

### Story 15: Fast UI
- **As a** user, **I want** quick responses, **so that** I can work efficiently.

### Future Stories
Task comments, task assignment, filter by project, edit project details, search tasks.

---

## Part 2: Use Cases

### Use Case 1: User Registration
- **Actors:** Visitor, System
- **Flow:** Fill form → validate → POST /register
- **Note:** Currently disabled (403) — accounts via Team page

### Use Case 2: User Login
- **Actors:** Registered User, System
- **Flow:** Enter email/password → POST /login → validate → create session → HttpOnly `sessionId` cookie + CSRF token in response → redirect to dashboard

### Use Case 3: Create Project
- **Actors:** Manager/Support User, System
- **Flow:** Click "Create New Project" → modal → enter name → POST /projects → create → refresh grid
- **Alternatives:** Empty name → validation error; member → 403

### Use Case 4: View Projects Dashboard
- **Actors:** Authenticated User, System
- **Flow:** Load dashboard → GET /projects → render cards
- **Member:** assigned projects; Manager/Support: owned projects

### Use Case 5: Close / Reopen Project
- **Actors:** Manager/Support User, System
- **Close:** Click "Close" → confirm → PATCH /projects/:id/close → status "completed" → red border
- **Reopen:** Click "Reopen" → confirm → PATCH /projects/:id/reopen → status "active" → green border

### Use Case 6: Delete Project
- **Actors:** Manager/Support User, System
- **Flow:** Click "Delete" → confirm → DELETE /projects/:id → cascade delete

### Use Case 7: Create Task
- **Actors:** Manager/Support User, System
- **Flow:** Tasks page → "Create Task" → fill form → POST /tasks → list updated

### Use Case 8: Update Task Status
- **Actors:** Authenticated User, System
- **Flow:** Click status dropdown → select → PUT /tasks/:id
- **Member:** status only; Manager/Support: all fields

### Use Case 9: Create User (Team)
- **Actors:** Manager/Support User, System
- **Flow:** Team page → "Create User" → POST /users

### Use Case 10: Change Role
- **Actors:** Support User, System
- **Flow:** Click "Promote to X" → confirm → POST /users/:id/change-role

### Use Case 11: Change Password
- **Actors:** Authenticated User, System
- **Flow:** Settings → enter passwords → POST /auth/change-password

### Use Case 12: Logout
- **Actors:** Authenticated User, System
- **Flow:** Click "Logout" → POST /auth/logout → clear session → redirect to login
