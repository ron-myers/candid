---
command: candid-fast-ship
description: Fast ship for low-risk changes — runs only the steps enabled in fastShip config
skill: candid-fast-ship
args:
  - name: auto-merge
    description: Enable auto-merge after PR creation (overrides fastShip config)
    required: false
  - name: no-auto-merge
    description: Disable auto-merge even if fastShip config enables it
    required: false
  - name: dry-run
    description: Show what would be done without executing
    required: false
---

Fast ship your current branch — only the steps you've enabled in `fastShip` config will run. PR creation always runs. Everything else is off by default.

Usage:
```
/candid-fast-ship                   # Ship with fastShip config defaults
/candid-fast-ship --auto-merge      # Force auto-merge after PR creation
/candid-fast-ship --no-auto-merge   # Skip auto-merge even if configured
/candid-fast-ship --dry-run         # Show plan without executing
```

Enable steps via the `fastShip` block in `.candid/config.json` — see the candid-fast-ship skill for keys.

For a full ship with all steps, use `/candid-ship` instead.
