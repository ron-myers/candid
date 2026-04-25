---
command: candid-chrome-qa
description: Drive a real Chrome session against a running web app, find bugs, and write structured findings to .context/findings/
skill: candid-chrome-qa
args:
  - name: url
    description: App URL to test (overrides prompted value, e.g. http://localhost:3000)
    required: false
  - name: mobile-only
    description: Skip desktop pass and run mobile-only (390x844). Explicit opt-in — desktop is the default and runs first otherwise.
    required: false
---

Run a structured QA pass on a running web app via Chrome. Walks the target like a real user across desktop and mobile, runs DOM/console/network probes, and emits findings as schema-compliant JSON to `.context/findings/<date>-<slug>.json`.

Usage:
```
/candid-chrome-qa                                          # Prompts for goal, prompt, and URL
/candid-chrome-qa --url http://localhost:3000              # Skip URL prompt
/candid-chrome-qa --mobile-only                            # Mobile pass only (rare; desktop runs first by default)
```

When invoked, you'll be asked for:
- **goal** — what surface to test (e.g. "Agent Config tabs, all 16")
- **prompt** — free-form QA plan (edge cases, hot spots, recently-changed surfaces)
- **app URL** — verified before any work begins (curl health check)

Output:
- **JSON findings file** at `.context/findings/<YYYY-MM-DD>-<slug>.json` — v2.0 schema with `context`, `findings`, and end-of-pass `summary` blocks
- **Stdout summary** at end of pass — severity counts, category breakdown, and titles + URLs of every P0/P1 finding

Requires the `mcp__claude-in-chrome__*` tools to be available (auto-loaded via ToolSearch on first use).
