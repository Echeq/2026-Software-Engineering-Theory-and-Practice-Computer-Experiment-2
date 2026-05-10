# User Stories

## Overview
This document contains the user stories generated for the SPMP (Student Project Management Platform), refined using AI assistance and human iteration. These stories form the foundation of our requirements and guide feature development.

## User Stories List

### Story 1: User Registration
- **As a** new visitor to the platform
- **I want to** register an account using my email address and a secure password
- **So that** I can access personalized project management features and save my work
- **Acceptance Criteria:**
  - Form validates email format
  - Password must be at least 6 characters
  - Password confirmation must match
  - Duplicate emails are rejected with clear error message
  - Successful registration redirects to login page

### Story 2: User Login
- **As a** registered user
- **I want to** log in with my email and password
- **So that** I can securely access my projects and tasks
- **Acceptance Criteria:**
  - Invalid credentials show generic error (security best practice)
  - Successful login provides JWT token
  - Token is stored securely in browser
  - Session persists for 24 hours
  - Failed attempts don't reveal if email exists

### Story 3: User Profile Viewing
- **As a** logged-in user
- **I want to** see my name displayed on the dashboard
- **So that** I can confirm I'm logged into the correct account
- **Acceptance Criteria:**
  - User name appears in header navigation
  - Profile data fetched from authenticated endpoint
  - Logout button is visible and functional

### Story 4: Create Project
- **As a** logged-in user
- **I want to** create a new project with a name and optional description
- **So that** I can organize related tasks together
- **Acceptance Criteria:**
  - Project name is required
  - Description is optional
  - Project is automatically associated with current user
  - Default status is "active"
  - New project appears immediately in projects list

### Story 5: View Projects
- **As a** logged-in user
- **I want to** see all projects I own in a visual grid
- **So that** I can quickly overview my work
- **Acceptance Criteria:**
  - Projects displayed as cards with name and description
  - Projects ordered by creation date (newest first)
  - Empty state shown when no projects exist
  - Each card shows project status badge
  - Responsive layout adapts to screen size

### Story 6: Delete Project
- **As a** project owner
- **I want to** delete a project I no longer need
- **So that** I can keep my workspace organized
- **Acceptance Criteria:**
  - Confirmation dialog prevents accidental deletion
  - Deleting a project also deletes all its tasks (CASCADE)
  - Only project owner can delete
  - Success message confirms deletion
  - Project disappears from list immediately

### Story 7: Create Task
- **As a** project owner
- **I want to** add tasks to my project with title, priority, and optional due date
- **So that** I can track individual work items
- **Acceptance Criteria:**
  - Task title is required
  - Priority levels: Low, Medium, High (default: Medium)
  - Due date is optional
  - Task is associated with specific project
  - Default status is "pending"
  - Task appears in assigned user's task list

### Story 8: View Assigned Tasks
- **As a** user
- **I want to** see all tasks assigned to me across all projects
- **So that** I can manage my workload effectively
- **Acceptance Criteria:**
  - Tasks displayed in list view
  - Each task shows title, description, priority badge, due date
  - Priority badges are color-coded (Low=blue, Medium=yellow, High=red)
  - Tasks ordered by creation date
  - Empty state shown when no tasks assigned

### Story 9: Update Task Status
- **As a** user assigned to a task
- **I want to** change the task status between Pending, In Progress, and Completed
- **So that** I can track my progress on work items
- **Acceptance Criteria:**
  - Status change via dropdown selector
  - Update happens without page reload (AJAX)
  - Only assigned user or project owner can update
  - Status changes persist in database
  - Visual feedback confirms update

### Story 10: Update Task Priority
- **As a** project owner
- **I want to** change a task's priority level
- **So that** I can indicate importance relative to other tasks
- **Acceptance Criteria:**
  - Priority can be changed to Low, Medium, or High
  - Changes reflected immediately in UI
  - Priority badge color updates accordingly

### Story 11: Set Task Due Date
- **As a** project owner
- **I want to** assign a due date to a task
- **So that** team members know when work should be completed
- **Acceptance Criteria:**
  - Due date is optional
  - Date picker facilitates easy selection
  - Due date displayed in task card
  - Past due dates could be highlighted (future enhancement)

### Story 12: Secure Session Management
- **As a** security-conscious user
- **I want to** have my session automatically expire after inactivity
- **So that** my account remains secure if I forget to log out
- **Acceptance Criteria:**
  - JWT tokens expire after 24 hours
  - Expired tokens require re-login
  - Logout clears token from browser
  - Protected routes reject invalid tokens

### Story 13: Responsive Dashboard Access
- **As a** mobile user
- **I want to** access the dashboard on my phone or tablet
- **So that** I can manage projects on the go
- **Acceptance Criteria:**
  - Layout adapts to small screens
  - Touch-friendly buttons and controls
  - Modals work on mobile devices
  - Text remains readable at all sizes

### Story 14: Input Validation and Error Feedback
- **As a** user filling out forms
- **I want to** see clear error messages when I make mistakes
- **So that** I can correct issues and successfully submit forms
- **Acceptance Criteria:**
  - Inline validation shows errors next to fields
  - Error messages are specific and helpful
  - Invalid fields are visually highlighted
  - Form submission prevented until errors fixed
  - Success messages confirm actions

### Story 15: Fast and Responsive UI
- **As a** user
- **I want** the application to respond quickly to my actions
- **So that** I can work efficiently without waiting
- **Acceptance Criteria:**
  - Page loads complete within 2 seconds
  - API responses under 200ms for most operations
  - Loading states shown during async operations
  - No UI freezing during data fetches

## Future/Optional Stories (Not Implemented Yet)

### Story 16: Add Comments to Tasks
- **As a** team member
- **I want to** add comments to tasks
- **So that** I can provide context and updates

### Story 17: Assign Tasks to Team Members
- **As a** project owner
- **I want to** assign tasks to other users
- **So that** work can be distributed among the team

### Story 18: Filter Tasks by Project
- **As a** user with many tasks
- **I want to** filter tasks by project
- **So that** I can focus on specific work areas

### Story 19: Edit Project Details
- **As a** project owner
- **I want to** edit project name and description
- **So that** I can keep project information up to date

### Story 20: Search Tasks
- **As a** user with many tasks
- **I want to** search tasks by title or description
- **So that** I can quickly find specific tasks

## Story Prioritization

**Must Have (MVP):** Stories 1-9 (Core authentication, projects, tasks)
**Should Have:** Stories 10-14 (Enhanced functionality, UX improvements)
**Nice to Have:** Stories 15 (Performance optimization)
**Future Release:** Stories 16-20 (Advanced features)

## Notes
- All stories were generated with AI assistance and refined by the team
- Acceptance criteria guide testing and implementation
- Future stories can be added in subsequent iterations
- Stories align with the project's core mission: simple, effective project and task management for students
