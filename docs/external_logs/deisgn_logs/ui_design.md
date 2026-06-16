# Frontend UI Design

## Overview
Vanilla TypeScript frontend built with Vite. No frameworks — native `fetch()` for API calls, native SVG for charts. Responsive design with CSS Grid and Flexbox.

## Design Principles
- **Responsive**: Mobile-first layout adapts from 320px to 1920px
- **Accessible**: ARIA labels, keyboard navigation, focus management
- **Themeable**: Light/dark mode toggle, persisted in localStorage
- **Internationalized**: All UI text via `data-i18n` attributes, 4 languages
- **Minimal**: Zero runtime dependencies (no jQuery, no React, no Chart.js, no HTMX)

---

## Pages

### 1. Login Page (`frontend/index.html`)
- **URL**: `/` or `/login.html`
- **Layout**: Centered card with app logo, email/password form, "Sign Up" link
- **States**: loading spinner during auth, error messages for invalid credentials
- **Auth**: SPA-style — fetches `/api/auth/login`, stores session token, redirects to dashboard

### 2. Registration Page (`frontend/signup.html`)
- **Layout**: Centered card with name/email/password/confirm form
- **Validation**: Client-side email format, password min 6 chars, match confirmation
- **Note**: Public registration currently disabled (403); accounts created via Team page

### 3. Dashboard (`frontend/dashboard/index.html`)
- **Layout**: Sidebar (collapsible on mobile) + topbar + main content area
- **Sections**:
  - **Greeting Banner**: Personalized welcome with user name and role badge
  - **Statistics Cards**: Total projects, active tasks, completed tasks counts
  - **Project Charts**: Native SVG doughnut (project status) + bar chart (task overview)
  - **Project Grid**: Card-based project list with search/filter buttons (All/Active/Completed)
  - **My Tasks**: Assigned tasks list with inline status dropdowns
- **Interactions**: Filter projects by status, create project from modal, close/reopen/delete project cards

### 4. Projects Page (`frontend/dashboard/projects.html`)
- **Layout**: Same sidebar + topbar, full-width project grid
- **Features**: Create project button + modal, project cards with close/reopen/delete actions, search bar
- **Empty State**: Member-specific message ("Contact your manager to be assigned to a project")

### 5. Tasks Page (`frontend/dashboard/tasks.html`)
- **Layout**: Sidebar + topbar, task management area with filters
- **Features**: Create task modal (manager/support), assign users, set priority/due date/tags/estimated hours
- **Task Cards**: Show title, description, priority badge, assigned user, due date, status dropdown
- **Permissions**: Members can only change status; managers can edit all fields

### 6. Settings Page (`frontend/dashboard/settings.html`)
- **Layout**: Sidebar + topbar, settings form
- **Sections**:
  - **Theme**: Light/dark toggle with preview
  - **Language**: Dropdown with EN/ZH/ES/RU options
  - **Password**: Change password form (current + new + confirm)

### 7. Team Page (`frontend/dashboard/team.html`)
- **Layout**: Sidebar + topbar, user management table
- **Features**: Create user modal (manager), user list with role badges, promote/demote buttons (support only), delete user (manager)

---

## Common Components

### Sidebar
- Collapsible on mobile via hamburger button
- Navigation links: Dashboard, Projects, Tasks, Team, Settings
- Active link highlighting based on current page
- User name + role badge in sidebar footer

### Topbar
- Page title (i18n-translated)
- Theme toggle button (sun/moon icon)
- Logout button

### Project Card
- Name, description (truncated), status badge (green=active, red=completed)
- Action buttons: Close/Reopen, Delete (visible based on role)
- Visual left-border color coding: green (#22C55E) for active, red (#EF4444) for completed
- Click-through to project details / tasks page

### Modals
- Project creation/editing form (overlay + centered card)
- Task creation form with project/priority/assignee/due date selectors
- Confirmation dialogs for delete actions
- Trap focus, close on Escape key or backdrop click

### Status Badges
| Status | Color |
|--------|-------|
| Active | Green (#22C55E) |
| Completed | Red (#EF4444) |
| Pending | Gray (#6B7280) |
| In Progress | Blue (#3B82F6) |

### Priority Badges
| Priority | Color |
|----------|-------|
| Low | Blue (#3B82F6) |
| Medium | Yellow (#EAB308) |
| High | Red (#EF4444) |

---

## Responsive Breakpoints

| Breakpoint | Target |
|-----------|--------|
| < 640px | Mobile (single column, collapsible sidebar) |
| 640–1024px | Tablet (2-column grid, condensed sidebar) |
| > 1024px | Desktop (3-column grid, full sidebar) |

---

## Technical Notes

### Build (Vite)
- 6 rollup entry points: `login`, `dashboard`, `projects`, `tasks`, `settings`, `team`
- Each HTML page references its TS entry via `<script type="module">`
- CSS is per-page, imported from TypeScript entry files
- Dev server proxies `/api` → `http://localhost:3000`

### Internationalization (i18n)
- Dictionaries in `frontend/src/i18n.ts` (EN, ZH, ES, RU — 1795 lines)
- All HTML elements use `data-i18n` / `data-i18n-aria-label` attributes
- Language selection persisted in localStorage (`app-language` key)
- Dynamic content translation via `i18n("key")` function

### Charts
- Native SVG rendering via `frontend/src/charts.ts`
- Functions: `renderDoughnut()`, `renderBar()` — pure DOM creation, no dependencies
- Charts update on language change (re-render with translated labels)

### Dynamic Content
- Project cards loaded via `fetch()` + `innerHTML` (replaces HTMX)
- Search/filter debounced at 250ms
- Project close/reopen/delete via event delegation on card grid
- No page reload on CRUD operations — cards are re-fetched
