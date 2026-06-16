---
name: ai-log-generate
description: Log every AI interaction — prompt, response, affected file, code before/after, and metadata. Triggers on "@ai-log".
---

## Workflow

When user says `@ai-log`, generate a log file by reading the conversation.

### 1. Auto-detect

Collect these automatically via bash:

| Field | Command (Windows) | Command (Mac/Linux) |
|---|---|---|
| PC Name | `$env:COMPUTERNAME` | `hostname` |
| Date | `Get-Date -Format "yyyy-MM-dd"` | `date +%F` |
| Time | `Get-Date -Format "HHmmss"` | `date +%H%M%S` |
| Git Branch | `git branch --show-current` | `git branch --show-current` |

### 2. Read from conversation history

Extract these from the chat, do NOT ask the user:

- **Prompt** — What the user asked (their messages)
- **AI Response** — What you replied (your messages)
- **File Path** — Files you created or edited
- **Code Before** — Previous content of edited files (use `git diff`)
- **Code After** — New content after your changes
- **AI Tool** — Always `OpenCode`

Run `git diff --name-only` to list changed files and `git diff` for full before/after.

If git diff is empty (new files not yet staged), compare file contents before/after via `read`.

### 3. Generate filename

Format: `AI-LOG-YYYY-MM-DD-HHMMSS-PCNAME.txt`

Example: `AI-LOG-2026-06-12-093931-DESKTOP-CR24C6G.txt`

### 4. Write the log

Save to `docs/log/<filename>` with the template below. Replace placeholders with real values.

```
╔══════════════════════════════════════════════════════════════╗
║                    AI INTERACTION LOG                        ║
╚══════════════════════════════════════════════════════════════╝

PC Name:      DESKTOP-ABC123
Date:         2026-06-12
Time:         09:39:31
Git Branch:   main
AI Tool:      OpenCode

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What the user asked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI RESPONSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What the AI replied

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FILE AFFECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

relative/path/to/file.js
relative/path/to/another.css

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE BEFORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

code before changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CODE AFTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

code after changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5. Confirm

Tell the user:

> ✅ Log saved to `docs/log/AI-LOG-2026-06-12-093931-DESKTOP-CR24C6G.txt`
