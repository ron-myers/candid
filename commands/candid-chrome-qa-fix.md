---
command: candid-chrome-qa-fix
description: Read the latest candid-chrome-qa findings JSON, pick which findings to fix, and dispatch fixes — batched PR, one PR per finding via Conductor deep links, local-only, or issues-only. Optionally files Linear issues per finding.
skill: candid-chrome-qa-fix
args:
  - name: file
    description: Specific findings file path (skips latest-resolution; e.g. .context/findings/2026-04-25-agent-config.json)
    required: false
  - name: severity
    description: Comma-separated severities to consider (P0,P1,P2,P3,P4)
    required: false
  - name: category
    description: Comma-separated categories to consider (bug,a11y,perf,ux,copy,security,compat)
    required: false
  - name: strategy
    description: One of "batched", "per-finding", "local", "issues-only" — skips the strategy prompt
    required: false
  - name: max-parallel
    description: Per-finding deep-link launch batch size (default 4)
    required: false
  - name: print-links
    description: In per-finding mode, print conductor:// deep links instead of opening them
    required: false
  - name: fast
    description: In batched mode, hand off to /candid-fast-ship instead of /candid-ship
    required: false
  - name: create-issues
    description: Force-enable Linear issue creation (overrides config)
    required: false
  - name: no-create-issues
    description: Force-disable Linear issue creation (overrides config)
    required: false
  - name: tracker-team
    description: Override issueTracker.teamKey for this run (e.g. ENG)
    required: false
---

Consume a `candid-chrome-qa` v2.0 findings file and turn it into actual code fixes — with optional Linear issue filing.

Usage:

```
/candid-chrome-qa-fix                                                        # Latest findings file, full prompts
/candid-chrome-qa-fix --severity P0,P1                                       # Only urgent + high severity
/candid-chrome-qa-fix --strategy issues-only                                 # File Linear issues, no fixes
/candid-chrome-qa-fix --strategy per-finding --print-links                   # Emit conductor:// deep links (dry run)
/candid-chrome-qa-fix --strategy batched --create-issues --tracker-team ENG  # Batched PR + Linear issues in team ENG
/candid-chrome-qa-fix --file .context/findings/2026-04-25-foo.json --strategy local
```

Full workflow, output format, and configuration: the candid-chrome-qa-fix skill.
