---
command: candid-chrome-qa
description: Drive a real Chrome session against a running web app, find bugs, and write structured findings to .context/findings/
skill: candid-chrome-qa
args:
  - name: url
    description: App URL to test (overrides prompted value, e.g. http://localhost:3000)
    required: false
  - name: goal
    description: Pre-fill the goal prompt (surface to test). Skip the interactive ask when provided.
    required: false
  - name: prompt
    description: Pre-fill the QA-plan prompt (edge cases, hot spots). Skip the interactive ask when provided.
    required: false
  - name: routes
    description: Comma-separated list of routes to limit the walk to (e.g. "/dashboard,/settings"). Without this, the walk follows goal+prompt.
    required: false
  - name: severity-floor
    description: Persist only findings at or above this severity. One of P0|P1|P2|P3|P4|P5. Default P5 (all).
    required: false
  - name: viewports
    description: Comma-separated viewports to override config defaults (e.g. "1440x900,390x844"). First = desktop, second = mobile.
    required: false
  - name: findings-dir
    description: Override findings output directory. Default .context/findings.
    required: false
  - name: mobile-only
    description: Skip desktop pass and run mobile-only (390x844). Explicit opt-in — desktop is the default and runs first otherwise.
    required: false
  - name: desktop-only
    description: Skip mobile pass and run desktop-only. Counterpart to --mobile-only.
    required: false
---

Run a structured QA pass on a running web app via Chrome. Walks the target like a real user across desktop and mobile, runs DOM/console/network probes, and emits findings as schema-compliant JSON to `.context/findings/<date>-<slug>.json`.

Usage:
```
/candid-chrome-qa                                          # Prompts for goal, prompt, and URL
/candid-chrome-qa --url http://localhost:3000              # Skip URL prompt
/candid-chrome-qa --goal "Settings tabs" --prompt "Walk every tab; toggle save/cancel"
/candid-chrome-qa --routes "/dashboard,/settings,/billing" # Limit walk to specific routes
/candid-chrome-qa --severity-floor P2                       # Persist only P0/P1/P2 findings
/candid-chrome-qa --viewports "1920x1080,414x896"           # Override viewport sizes
/candid-chrome-qa --findings-dir .qa/runs                   # Custom output directory
/candid-chrome-qa --mobile-only                             # Mobile pass only (skip desktop)
/candid-chrome-qa --desktop-only                            # Desktop pass only (skip mobile)
```

Full workflow, output format, and configuration: the candid-chrome-qa skill.
