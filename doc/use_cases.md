# Use Case Interaction Scenarios

## Overview
Detailed interaction scenarios for each user story in SPMP.

## Use Case 1: User Registration
- **Actors:** Visitor, System
- **Preconditions:** On signup page (http://localhost:5173/signup.html)
- **Flow:** Fill form → validate → POST /register
- **Note:** Currently disabled (403) — accounts via Team page

## Use Case 2: User Login
- **Actors:** Registered User, System
- **Preconditions:** On login page
- **Flow:** Enter email/password → POST /login → validate → create session → JWT + cookies → redirect to dashboard
- **Alternatives:** Invalid credentials → 401 generic error

## Use Case 3: Create Project
- **Actors:** Manager/Support User, System
- **Preconditions:** Logged in with manager/support role
- **Flow:** Click "Create New Project" → modal → enter name → POST /projects → create → refresh grid
- **Alternatives:** Empty name → validation error; member → 403

## Use Case 4: View Projects Dashboard
- **Actors:** Authenticated User, System
- **Flow:** Load dashboard → GET /projects → render cards with status badges
- **Member:** sees assigned projects; Manager/Support: sees owned

## Use Case 5: Close / Reopen Project
- **Actors:** Manager/Support User, System
- **Preconditions:** Owns the project
- **Close:** Click "Close" → confirm → PATCH /projects/:id/close → status "completed" → red border
- **Reopen:** Click "Reopen" → confirm → PATCH /projects/:id/reopen → status "active" → green border

## Use Case 6: Delete Project
- **Actors:** Manager/Support User, System
- **Flow:** Click "Delete" → confirm → DELETE /projects/:id → cascade delete tasks + entries → card removed

## Use Case 7: Create Task
- **Actors:** Manager/Support User, System
- **Flow:** Tasks page → "Create Task" → fill form → POST /tasks → task appears in list

## Use Case 8: View and Update Task Status
- **Actors:** Authenticated User, System
- **Flow:** View task list → click status dropdown → select new status → PUT /tasks/:id
- **Member:** status only; Manager/Support: all fields

## Use Case 9: Team Management (Create User)
- **Actors:** Manager/Support User, System
- **Flow:** Team page → "Create User" → fill name/email/password/role → POST /users

## Use Case 10: Team Management (Change Role)
- **Actors:** Support User, System
- **Flow:** Team page → click "Promote to X" → confirm → POST /users/:id/change-role
- **Note:** Button text dynamic based on current role

## Use Case 11: Settings (Change Password)
- **Actors:** Authenticated User, System
- **Flow:** Settings → enter current + new password → POST /auth/change-password → invalidate other sessions

## Use Case 12: Logout
- **Actors:** Authenticated User, System
- **Flow:** Click "Logout" → POST /auth/logout → delete session → clear token → redirect to login
