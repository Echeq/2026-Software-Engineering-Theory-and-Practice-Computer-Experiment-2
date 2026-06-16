# Test Report

## Overview

The SPMP project includes **50 automated unit tests** covering all backend models, plus manual API and functional tests for end-to-end verification. This document reports on both test suites.

**Testing Date:** June 16, 2026
**Environment:** Windows, Node.js v24.14.1, SQLite (sql.js)
**Test Runner:** Jest 30 + ts-jest 29

---

## Automated Unit Tests (Jest)

All 50 tests run in an isolated in-memory SQLite database. Every test file starts with a clean database state, ensuring zero cross-contamination. The tests mock the `backend/src/database` module, routing all queries to an in-memory `sql.js` instance instead of the production file.

### How to Run

```bash
cd backend
npm test
```

### Test Results

**Test Suites:** 5 passed, 5 total
**Tests:** 50 passed, 50 total

### Module: Database (`test/database.test.ts`) — 5 tests

| Test | What it verifies |
|------|-----------------|
| `all tables are created on init` | `users`, `projects`, `tasks`, `sessions`, `time_entries` all exist |
| `insert and query round-trip` | Data written via `run()` is returned by `query()` |
| `queryOne returns first result only` | Only the first matching row is returned |
| `queryOne returns null when no results` | Empty result set returns `null` |
| `run throws on invalid SQL` | Malformed queries raise an error |

### Module: Auth (`test/auth.test.ts`) — 16 tests

**UserModel (10 tests):**

| Test | What it verifies |
|------|-----------------|
| `create inserts a user with hashed password` | Password is bcrypt-hashed, not stored in plaintext |
| `create rejects duplicate email` | Unique constraint on `email` raises an error |
| `verifyPassword works correctly` | Correct password returns `true`, wrong password returns `false` |
| `findByEmail finds existing user` | Existing user is returned by email lookup |
| `findByEmail returns null for unknown email` | Unknown email returns `null` |
| `findById returns user` | User is returned by ID lookup |
| `updateRole changes user role` | Role changes from `member` → `manager` / `support` |
| `listAll returns users without password_hash` | `password_hash` is excluded from `listAll()` |
| `updatePassword changes hash` | Old password no longer works after change |
| `delete removes user` | User is removed from the database |

**SessionModel (6 tests):**

| Test | What it verifies |
|------|-----------------|
| `create and findActiveById` | Session is created and found as active |
| `findActiveById returns null for expired session` | Past `expires_at` returns `null` |
| `delete removes session` | Session is removed after `delete()` |
| `touch updates last_seen_at` | `last_seen_at` timestamp changes on `touch()` |
| `deleteExpired removes only expired sessions` | Only past sessions are removed; future sessions survive |
| `deleteByUserId removes all sessions for a user` | All sessions for a given user are deleted |

### Module: Projects (`test/projects.test.ts`) — 11 tests

| Test | What it verifies |
|------|-----------------|
| `create inserts a project` | Project has a UUID, correct `owner_id`, default `active` status |
| `create assigns defaults for missing fields` | `description` is `null`, `status` is `active` |
| `findById returns null for missing project` | Non-existent ID returns `null` |
| `findById returns project` | Existing project is found by ID |
| `findByOwnerId returns only owned projects` | Only projects owned by the given user are returned |
| `findByOwnerId returns empty for user with no projects` | User with no projects gets an empty array |
| `update changes project name` | Project name is updated |
| `update changes status to completed` | Status changes from `active` to `completed` |
| `delete removes project` | Project is removed from the database |
| `delete returns true for existing project` | `delete()` returns `true` when deletion succeeds |
| `delete does not cascade to tasks` | Tasks survive project deletion (no automatic cascade) |

### Module: Tasks (`test/tasks.test.ts`) — 10 tests

| Test | What it verifies |
|------|-----------------|
| `create inserts a task with defaults` | Default status `pending`, priority `medium`, tags `[]`, hours `0` |
| `create accepts all optional fields` | `assigned_to`, `priority`, `due_date`, `tags`, `estimated_hours` all set |
| `findById returns null for missing task` | Non-existent ID returns `null` |
| `findById returns task` | Existing task is found by ID |
| `findByProjectId returns tasks for a project` | All tasks for a project are returned |
| `findByProjectId returns empty for project with no tasks` | Empty task list returns `[]` |
| `findByAssignedTo returns assigned tasks` | Only tasks assigned to the given user are returned |
| `update changes multiple fields` | `title`, `status`, `priority` all updated in one call |
| `update only changes provided fields` | Only specified fields are modified; unspecified fields remain unchanged |
| `delete removes task` | Task is removed from the database |

### Module: Users (`test/users.test.ts`) — 8 tests

| Test | What it verifies |
|------|-----------------|
| `listAll returns all users` | All users are returned |
| `listAll does not expose password_hash` | `password_hash` is excluded from `listAll()` |
| `updateRole promotes to manager` | Role changes from `member` to `manager` |
| `updateRole promotes to support` | Role changes from `manager` to `support` |
| `delete removes user` | User is removed from the database |
| `delete is idempotent on missing user` | Deleting a non-existent user does not throw |
| `findById returns null for deleted user` | Deleted user returns `null` |
| `projects survive owner deletion (no cascade)` | Projects owned by deleted user remain in the database |

---

## Manual API Tests (curl)

The following endpoints were tested manually with `curl` against the running development server (`http://localhost:3000`).

**Testing Date:** April 30, 2026

### Authentication

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | Register with valid data | 201, user without password | PASS |
| 2 | Register with duplicate email | 409 Conflict | PASS |
| 3 | Register with weak password | 400 Bad Request | PASS |
| 4 | Login with valid credentials | 200, session + CSRF | PASS |
| 5 | Login with invalid password | 401 Unauthorized | PASS |
| 6 | Login with non-existent email | 401, generic error (no email enumeration) | PASS |
| 7 | Protected route without token | 401 Unauthorized | PASS |
| 8 | Protected route with invalid token | 403 Forbidden | PASS |

### Projects

| # | Test | Expected | Result |
|---|------|----------|--------|
| 9 | Create project with valid data | 201, project with UUID | PASS |
| 10 | Create project without name | 400 Bad Request | PASS |
| 11 | Get all projects | 200, array | PASS |
| 12 | Get specific project | 200, project details | PASS |
| 13 | Delete project | 200, confirmed removal | PASS |

### Tasks

| # | Test | Expected | Result |
|---|------|----------|--------|
| 14 | Create task with valid data | 201, task with UUID | PASS |
| 15 | Create task without title | 400 Bad Request | PASS |
| 16 | Get tasks assigned to user | 200, array | PASS |
| 17 | Update task status | 200, status changed | PASS |
| 18 | Update task priority | 200, priority changed | PASS |
| 19 | Delete task | 200, confirmed removal | PASS |

### Health

| # | Test | Expected | Result |
|---|------|----------|--------|
| 20 | API health endpoint | 200, `{ status: "ok", timestamp }` | PASS |

---

## Functional Tests

Manual browser-based testing of the frontend UI on `http://localhost:5173`.

| Feature | Steps | Result |
|---------|-------|--------|
| Login flow | Enter credentials → submit → dashboard loads | PASS |
| Dashboard rendering | Greeting, stats, charts, project grid, task list visible | PASS |
| Project creation via UI | Click "Create New Project" → modal → enter name → created | PASS |
| Task status update | Dropdown changes status without page reload | PASS |
| Logout | Token cleared, redirect to login | PASS |

---

## Bug Tracking

| Bug ID | Description | Severity | Status |
|--------|------------|----------|--------|
| BUG-01 | `better-sqlite3` compilation failure with Node.js v24 | High | Fixed — replaced with `sql.js` |
| BUG-02 | TypeScript duplicate identifier errors | Medium | Fixed — added `export {}` |
| BUG-03 | HTML files not found by Express | High | Fixed — copied to `public/` |
| BUG-04 | API URLs pointing to wrong port | Medium | Fixed |
| BUG-05 | Database not persisting | High | Fixed — file-based save on every `run()` |
| BUG-06 | CORS errors | Low | Fixed — added CORS middleware |

---

## Security Verification

| Test | Method | Result |
|------|--------|--------|
| SQL Injection | Parameterized queries (`query()`, `run()`) | PASS |
| XSS | `escapeHtml()` helper on all user input | PASS |
| Password Storage | bcrypt with 10 salt rounds | PASS |
| Session Expiry | 24-hour TTL enforced via `expires_at` | PASS |
| CSRF | Per-session token validated on state-changing requests | PASS |

---

## Summary

| Category | Total | Passed | Failed | Pass Rate |
|----------|-------|--------|--------|-----------|
| Automated Unit Tests | 50 | 50 | 0 | 100% |
| Manual API Tests | 20 | 20 | 0 | 100% |
| Functional Tests | 5 | 5 | 0 | 100% |
| **Overall** | **75** | **75** | **0** | **100%** |
