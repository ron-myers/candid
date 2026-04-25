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

Workflow:

1. **Resolve findings file** — `--file` or latest in `.context/findings/`.
2. **Validate v2.0 schema** — abort on mismatch.
3. **Filter & summarize** — drop `✓ no issues` markers; apply `--severity` / `--category`.
4. **Multi-select** — native checkbox UX for ≤15 findings; bulk presets + custom indices for more.
5. **Strategy** — batched / per-finding (Conductor) / local / issues-only.
6. **Issue tracker** — optional Linear issue creation, with dedup probe and single-issue invariant.
7. **Execute** — apply fixes, create PR, or dispatch deep links.
8. **Summary** — per-finding status + PR/issue links.

Output:

- **Batched mode**: one PR with all selected fixes; Linear issues linked in PR title + body if enabled.
- **Per-finding mode**: N `conductor://` deep links, each spawning a fresh Conductor workspace that fixes one finding and ships its own PR.
- **Local mode**: edits applied to the working tree, no PR.
- **Issues-only mode**: Linear issues created from each finding; no code changes.
- **Sidecar log**: `.context/findings/<base>.fixes.md` records every fix applied (timestamp, finding ID, files changed).

Configuration: see `skills/candid-chrome-qa-fix/SKILL.md` → `## Configuration`. Provider details: see `skills/candid-chrome-qa-fix/WORKFLOW.md`.

Requires `mcp__claude_ai_Linear__save_issue` + `mcp__claude_ai_Linear__list_issues` to be available when issue creation is enabled. macOS for `open`-launched Conductor deep links (per-finding mode falls back to `--print-links` on other platforms).
