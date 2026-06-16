# User Guide — SPMP Platform

## Getting Started

### Accessing the Application
1. Open your web browser
2. Navigate to `http://localhost:5173` (dev) or `http://localhost:3000` (production)
3. You will see the login page

### Test Accounts (after `npm run inject:user`)

| Email | Password | Role |
|-------|----------|------|
| support@test.com | support123 | Support (full access) |
| manager@test.com | manager123 | Manager (CRUD projects/tasks/users) |
| member@test.com | member123 | Member (view + task status only) |

### Running Automated Tests

```bash
cd backend
npm test
```

50 unit tests covering database helpers, user/session/project/task models. Uses an in-memory SQLite database — no configuration needed. Full results in `doc/test.md`.

---

## Dashboard

After logging in, you land on the dashboard:

### Overview Section
- **Greeting**: Personalized welcome with your name and role badge
- **Statistics**: Total projects, active tasks, completed tasks
- **Charts**: SVG doughnut chart (project status) + bar chart (task overview)

### My Projects
- Projects displayed as cards in a responsive grid
- Each card shows: project name, description, status badge
- **Filter buttons**: All / Active / Completed — filter projects by status
- **Search bar**: Type to search projects by name
- **Color coding**: Active projects have a green left border; completed projects have a red left border

### My Tasks
- Tasks assigned to you, listed with priority badges and status dropdowns
- Change task status directly from the dropdown: Pending → In Progress → Completed

---

## Role Permissions

### Manager & Support
- Create, edit, close, reopen, and delete projects
- Create, edit, and delete tasks
- Assign tasks to team members
- Access Team page to manage users

### Member
- View projects you're assigned to
- View and update your task status only
- Cannot create projects, tasks, or manage users

---

## Managing Projects

### Creating a Project (Manager/Support)
1. On the Dashboard or Projects page, click "Create New Project"
2. Enter a project name (required) and optional description
3. Click "Create" — the new project appears immediately

### Closing a Project (Manager/Support)
1. On a project card, click the "Close" button
2. Confirm the action — the project status changes to "completed" (red border)

### Reopening a Project (Manager/Support)
1. On a closed project card, click the "Reopen" button
2. Confirm — the project returns to "active" status (green border)

### Deleting a Project (Manager/Support)
1. Click the "Delete" button on the project card
2. Confirm deletion — this permanently deletes the project and all its tasks

---

## Managing Tasks

### Creating a Task (Manager/Support)
1. On the Tasks page, click "Create Task"
2. Fill in:
   - Title (required)
   - Description (optional)
   - Project (select from your projects)
   - Assigned To (select a team member)
   - Priority: Low / Medium / High
   - Due Date (optional)
   - Tags (optional, comma-separated)
   - Estimated Hours (optional)
3. Click "Create"

### Updating Task Status
1. Find the task in your task list
2. Use the status dropdown to change between:
   - Pending (gray)
   - In Progress (blue)
   - Completed (green)
3. **Members**: can only change status
4. **Managers/Support**: can edit all task fields

### Deleting a Task (Manager/Support)
1. Click the delete button on the task card
2. Confirm deletion

---

## Team Management

### Accessing the Team Page
- **Managers/Support**: Click "Team" in the sidebar
- **Members**: The Team link is not visible

### Creating a User (Manager/Support)
1. On the Team page, click "Create User"
2. Enter name, email, and password
3. Select role (member or manager — support cannot be assigned via UI)
4. Click "Create"

### Changing User Role (Support only)
1. On the Team page user list, click "Promote to Manager" or "Promote to Support"
2. The button text changes dynamically based on the user's current role
3. Confirm the promotion

### Deleting a User (Manager/Support)
1. Click the delete button next to the user
2. Confirm — the user's tasks will be unassigned

---

## Settings

### Changing Theme
1. Go to Settings → Theme
2. Toggle between Light and Dark mode
3. The setting is saved for your next visit

### Changing Language
1. Go to Settings → Language
2. Select from: English, Chinese (简体中文), Spanish (Español), Russian (Русский)
3. The interface updates immediately

### Changing Password
1. Go to Settings → Password
2. Enter your current password, new password, and confirm
3. Click "Change Password"
4. Your session will remain active

---

## Tips
- Use descriptive project names and task titles
- Set priorities to manage workload effectively
- Update task statuses regularly to track progress
- Use the filter buttons to focus on active or completed projects
- Managers should regularly review and assign tasks on the Tasks page

## Troubleshooting
- If login fails, check your email and password
- If pages don't load, ensure both backend (port 3000) and frontend (port 5173) are running
- Clear browser cache if styles appear broken
- Database issues: delete `backend/data/spmp.db` and restart the dev server
