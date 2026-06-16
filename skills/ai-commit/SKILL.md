---
name: ai-commit
description: Stage all changes and create a conventional commit. Triggers on "@ai-commit".
---

## Workflow

1. Run `git diff --stat` and `git diff` to see changes
2. Generate a conventional commit message based on the changes
3. Run `git add .` (excludes `.gitignore` entries like `.env`, `node_modules/`, `generated/prisma/`)
4. Run `git commit -m "<type>: <description>"`
5. Confirm to the user

## Commit types

feat, fix, docs, style, refactor, perf, test, chore

## Notes

- `.env` files are never committed (in `.gitignore`)
- `backend/generated/prisma/` is never committed (in `.gitignore`)
- Root `package-lock.json` and `.opencode/plans/` should be excluded if present
