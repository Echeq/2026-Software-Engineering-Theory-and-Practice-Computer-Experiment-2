# Skill: Software Engineering Theory and Practice Course Design

## Description
This skill enables the AI to execute the complete "Software Engineering Theory and Practice Course Design" workflow. It covers 5 modules: Requirements Analysis, Architecture & Design, Implementation, Testing, and Deployment & Documentation.

## Workflow

### 1. On Activation
When the user invokes this skill, the AI MUST:

1. **Read this skill file** (`/skills/software_engineering_course_skill.md`) to refresh its instructions.
2. **List all existing files** in `/docs` to understand current progress.
3. **Ask the user**: which module they want to work on (1–5) or whether to continue from where they left off.

### 2. Directory Structure
All documentation goes under `/docs`. The skill itself lives at `/skills/software_engineering_course_skill.md`. Existing `/docs` files may be overwritten without warning.

### 3. Mandatory Pre-Action Checks
Before generating or modifying any document, the AI MUST:
- Read this skill file.
- Read the current state of `/docs` to understand progress.
- Only then proceed to generate, update, or modify documents.

### 4. Interaction Logging
Every user-AI interaction must be recorded in `/docs/ai.md` with:
- Original user prompt.
- Summary of AI output.
- Problems identified.
- Iterations and improvements applied.

Additionally, `/docs/assign.md` must be updated to reflect who (user or AI) made each change.

### 5. Language
All `.md` files under `/docs` must be written in **English** exclusively.

### 6. Required Documents per Module

| Module | Documents |
|--------|-----------|
| 1 – Requirements Analysis | `user_stories.md`, `use_cases.md` |
| 2 – Architecture & Design | `architect.md`, `ui_design.md`, `backend_api.md`, `db.md` |
| 3 – Implementation | Source code in corresponding folders (not in `/docs`) |
| 4 – Testing | `test.md` |
| 5 – Deployment & Documentation | `install.md`, `user_guid.md` |
| Cross-cutting | `ai.md`, `assign.md`, `README.md` |

### 7. Document Format
Every document must use Markdown with tables, lists, and code blocks where appropriate. Metadata header at the top of each file:

```markdown
# Document: <name> | Module: <1-5> | Last updated: YYYY-MM-DD
```

### 8. AI Behavior
- Never assume the user accepts the first output. Always ask whether to iterate.
- When the user requests changes, update the corresponding document and log the iteration in `ai.md` and `assign.md`.
- If a document already exists in `/docs`, read it before regenerating.

### 9. Ethical Marking
Any automatically generated section must be marked with `[AI-generated]` followed by a brief explanation of why it was generated that way.

### 10. Final Delivery
At the end of the entire process, generate `/docs/FINAL_REPORT.md` containing:
- Executive summary.
- Links to all generated documents.
- Self-assessment of compliance with course criteria.

## Example Interaction Flow

1. User activates the skill.
2. AI reads this skill file and lists `/docs`.
3. AI asks: *"Which module would you like to work on (1–5)? Or shall we continue from where we left off?"*
4. User responds.
5. AI reads existing docs for that module, generates or updates them, then logs the interaction in `ai.md` and `assign.md`.
6. AI asks: *"Does this look good, or would you like to iterate?"*
