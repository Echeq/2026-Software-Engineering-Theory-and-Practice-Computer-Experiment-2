# Frontend UI Design

## Overview
Vanilla TypeScript frontend built with Vite. No frameworks — native `fetch()` for API calls, native SVG for charts.

## Design Principles
- **Responsive**: Mobile-first, 320px to 1920px
- **Accessible**: ARIA labels, keyboard nav, focus management
- **Themeable**: Light/dark mode toggle (localStorage)
- **Internationalized**: `data-i18n` attributes, 4 languages
- **Zero runtime deps**: No jQuery, React, Chart.js, or HTMX

---

## Pages

### 1. Login Page
- Centered card with logo, email/password form, "Sign Up" link
- Loading spinner during auth, error messages for invalid credentials

### 2. Registration Page
- Centered card with name/email/password/confirm form
- Client-side validation (email format, password ≥ 6 chars)
- Public registration **disabled** (403) — accounts via Team page

### 3. Dashboard
- Sidebar (collapsible on mobile) + topbar + main content
- Sections: Greeting banner, statistics cards, SVG charts, project grid, task list
- Filter buttons: All / Active / Completed
- Search bar (debounced 250ms)

### 4. Projects Page
- Full-width project grid with create button + modal
- Close/reopen/delete actions on cards
- Member-specific empty state message

### 5. Tasks Page
- Task management with create modal
- Assign users, set priority/due date/tags/hours
- Status dropdown per task (member: status only)

### 6. Settings Page
- Theme toggle (light/dark)
- Language selector (EN/ZH/ES/RU)
- Password change form

### 7. Team Page
- User management table
- Create user modal, role badges, promote/delete actions

---

## Common Components

### Sidebar
- Collapsible via hamburger on mobile
- Links: Dashboard, Projects, Tasks, Team, Settings
- User name + role badge in footer

### Project Card
- Name, description, status badge (green=active, red=completed)
- Action buttons by role
- Left-border color coding: green (#22C55E) / red (#EF4444)

### Modals
- Centered overlay with form / confirmation
- Focus trap, Escape/backdrop close

### Badges
| Status | Color | Priority | Color |
|--------|-------|----------|-------|
| Active | #22C55E | Low | #3B82F6 |
| Completed | #EF4444 | Medium | #EAB308 |
| Pending | #6B7280 | High | #EF4444 |
| In Progress | #3B82F6 | | |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 640px | Mobile, single column, collapsible sidebar |
| 640–1024px | Tablet, 2-column grid |
| > 1024px | Desktop, 3-column grid |

---

## Technical Notes

### Build (Vite)
- 6 entry points: login, dashboard, projects, tasks, settings, team
- Dev proxy: `/api` → `http://localhost:3000`

### i18n
- Dictionaries in `frontend/src/i18n.ts` (1795 lines)
- `data-i18n` / `data-i18n-aria-label` attributes
- Language in localStorage (`app-language` key)

### Charts
- Native SVG: `renderDoughnut()`, `renderBar()` in `charts.ts`
- No dependencies, re-render on language change

### Dynamic Content
- `fetch()` + `innerHTML` (no HTMX)
- Event delegation for card actions
- No page reload on CRUD
