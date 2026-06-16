# AI Usage Log

## Overview
This document records significant interactions with AI tools during the SPMP project development, including prompts, outputs, issues, and human iterations.

## Module 1: Requirements Analysis

### Interaction 1: Generating User Stories
- **Prompt:** "Generate user stories for a Student Project Management Platform (SPMP) with features for user management, project management, task management, task assignment, status tracking, and optional comments."
- **AI Output Summary:** Generated comprehensive user stories covering registration, login, project CRUD, task creation, assignment, status updates, and filtering.
- **Issues Identified:** Initial output lacked specific acceptance criteria for password validation and project ownership constraints.
- **Human Iteration:** Added explicit security requirements (password min 6 chars, JWT authentication) and refined stories to include edge cases like duplicate email handling.

### Interaction 2: Refining Use Cases
- **Prompt:** "Create detailed use case scenarios for user registration and login flows in SPMP, including main flow, alternative flows, and error conditions."
- **AI Output Summary:** Provided structured use cases with preconditions, main flows, alternative flows, and postconditions.
- **Issues Identified:** Missing validation steps for email format and password strength.
- **Human Iteration:** Enhanced to include client-side and server-side validation steps.

## Module 2: Design

### Interaction 3: Database Schema Design
- **Prompt:** "Design an SQLite database schema for a project management system with users, projects, and tasks."
- **AI Output Summary:** Generated SQL schema with three tables including proper relationships, CASCADE deletes, and timestamps.
- **Issues Identified:** Missing task priority and due_date.
- **Human Iteration:** Added priority, due_date, refined foreign keys.

### Interaction 4: API Endpoint Design
- **Prompt:** "Design RESTful API endpoints for a project management platform with authentication, projects, and tasks resources."
- **AI Output Summary:** Created comprehensive API documentation.
- **Issues Identified:** Missing authorization checks.
- **Human Iteration:** Added JWT authentication requirements, ownership validation.

## Module 3: Implementation

### Interaction 5: Backend Architecture Setup
- **Prompt:** "Create a Node.js Express TypeScript backend structure with SQLite database, JWT authentication, and modular routing."
- **AI Output Summary:** Generated complete folder structure with src/database, src/models, src/routes, src/middleware.
- **Issues Identified:** Initial suggestion used better-sqlite3 (incompatible with Node.js v24).
- **Human Iteration:** Switched to sql.js.

### Interaction 6: Frontend TypeScript Conversion
- **Prompt:** "Convert vanilla JavaScript login/signup forms to TypeScript."
- **AI Output Summary:** Provided TypeScript versions with typed interfaces.
- **Issues Identified:** TypeScript treated all files as single module.
- **Human Iteration:** Added `export {}` to each file.

### Interaction 7: Dashboard UI Development
- **Prompt:** "Create a responsive dashboard HTML/CSS/TypeScript page for managing projects and tasks with modals."
- **Issues Identified:** Missing task status update functionality.
- **Human Iteration:** Added inline status dropdowns, priority badges.

### Interaction 8: Debugging Database Issues
- **Prompt:** "Fix better-sqlite3 compilation error with Node.js v24."
- **AI Output Summary:** Suggested updating or switching library.
- **Human Iteration:** Replaced with sql.js, rewrote database helpers.

## Module 4: Testing

### Interaction 9: API Testing Strategy
- **Prompt:** "How to test REST API endpoints for authentication and CRUD using curl."
- **Issues Identified:** Needed to reuse JWT token across requests.
- **Human Iteration:** Created sequential test script.

## Module 5: Internationalization & Documentation

### Interaction 10: Adding Russian Language Support
- **Prompt:** "Add support for Russian language (ru) in the i18n system."
- **AI Output Summary:** Added ru locale dictionary.
- **Issues Identified:** None.
- **Human Iteration:** Approved.

### Interaction 11: Adding data-i18n Attributes to HTML
- **Prompt:** "Add data-i18n attributes to all HTML pages."
- **Issues Identified:** Sidebar Team link lost icon, missing translation keys.
- **Human Iteration:** Fixed icon placement, added missing keys.

### Interaction 12: Fixing Missing Translation Keys
- **Prompt:** "Fix missing translations for zh, es, and ru dictionaries."
- **AI Output Summary:** Identified 8 missing keys in Russian, added them.
- **Issues Identified:** Chinese and Spanish also missing some keys.
- **Human Iteration:** Added all missing keys.

### Interaction 13: Creating the Course Skill
- **Prompt:** "Create a skill file for the AI to execute the Software Engineering course workflow."
- **AI Output Summary:** Generated skill file with workflow rules, structure, format specs.
- **Human Iteration:** Approved.

### Interaction 14: Documentation Refresh
- **Prompt:** "Read all current docs content and reorganize into /doc/ with specific file structure (user_guid, install, usermanual, test, assign, ai, db, backend_api, ui_design, architect, design, use_cases, user_stories, requirements) and update README with new index."
- **Human Iteration:** Specified exact file mapping (solo vs combined).

## Summary of AI Contributions
- **Code Generation:** ~60% of boilerplate (models, routes, interfaces)
- **Architecture Design:** Folder structure, middleware patterns
- **Debugging:** Identified dependency issues, suggested alternatives
- **Documentation:** API specs, use cases, all doc files
- **Internationalization:** Russian locale, data-i18n hooks, key fixes
- **AI Skill Creation:** Course skill at `/skills/software_engineering_course_skill.md`

## Human Contributions
- Security: JWT strategy, password hashing, input validation
- Database: Switched to sql.js, query helpers
- UI/UX: Responsive layouts, color schemes, user flows
- Integration: Frontend-backend connection, CORS, static serving
- Testing: Manual API testing, E2E workflows
- i18n: Review, sidebar fix, locale completeness
