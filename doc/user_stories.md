# User Stories

## Overview
User stories for the SPMP (Student Project Management Platform), refined using AI assistance.

### Story 1: User Registration
- **As a** new visitor
- **I want to** register with email and password
- **So that** I can access project management features
- **Acceptance:** Email validation, password ≥ 6 chars, match confirmation, duplicate rejection

### Story 2: User Login
- **As a** registered user
- **I want to** log in with my credentials
- **So that** I can access my projects
- **Acceptance:** Generic error on invalid credentials, HttpOnly session cookie + CSRF token, 24h session expiry

### Story 3: User Profile Viewing
- **As a** logged-in user
- **I want to** see my name on the dashboard
- **So that** I can confirm my account

### Story 4: Create Project
- **As a** manager/support user
- **I want to** create a project with name and description
- **So that** I can organize tasks

### Story 5: View Projects
- **As a** user
- **I want to** see all projects in a visual grid
- **So that** I can overview my work

### Story 6: Delete Project
- **As a** project owner
- **I want to** delete unwanted projects
- **So that** I can keep things organized
- **Acceptance:** Confirmation dialog, cascade delete tasks

### Story 7: Create Task
- **As a** manager/support user
- **I want to** add tasks with title, priority, due date
- **So that** I can track work items

### Story 8: View Assigned Tasks
- **As a** user
- **I want to** see all tasks assigned to me
- **So that** I can manage my workload

### Story 9: Update Task Status
- **As a** user
- **I want to** change task status
- **So that** I can track progress
- **Acceptance:** Dropdown selector, no page reload

### Story 10: Update Task Priority
- **As a** project owner
- **I want to** change priority level
- **So that** I can indicate importance

### Story 11: Set Task Due Date
- **As a** project owner
- **I want to** assign a due date
- **So that** team knows deadlines

### Story 12: Secure Session Management
- **As a** security-conscious user
- **I want** sessions to expire
- **So that** my account stays secure

### Story 13: Responsive Dashboard
- **As a** mobile user
- **I want to** access the dashboard on my phone
- **So that** I can manage on the go

### Story 14: Input Validation
- **As a** user
- **I want** clear error messages
- **So that** I can fix issues

### Story 15: Fast UI
- **As a** user
- **I want** quick responses
- **So that** I can work efficiently

## Future Stories
- Task comments, task assignment, filter by project, edit project details, search tasks

## Prioritization
- **Must Have (MVP):** Stories 1-9
- **Should Have:** Stories 10-14
- **Nice to Have:** Story 15
- **Future:** Stories 16-20
