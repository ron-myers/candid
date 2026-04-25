---
command: candid-ship
description: Ship your changes - review, build, test, create PR, and optionally auto-merge
skill: candid-ship
args:
  - name: auto-merge
    description: Auto-merge the PR after creation (overrides config)
    required: false
  - name: no-auto-merge
    description: Do not auto-merge even if config enables it
    required: false
  - name: skip-review
    description: Skip the candid-loop review step
    required: false
  - name: skip-install
    description: Skip the dependency install step
    required: false
  - name: skip-build
    description: Skip the build verification step
    required: false
  - name: skip-tests
    description: Skip the test step
    required: false
  - name: dry-run
    description: Show what would be done without executing
    required: false
---

Ship your current branch - review code, run build and tests, create a PR, and optionally auto-merge.

Usage:
```
/candid-ship                        # Full workflow with config defaults
/candid-ship --auto-merge           # Force auto-merge after PR creation
/candid-ship --no-auto-merge        # Skip auto-merge even if configured
/candid-ship --skip-review          # Skip candid-loop, go straight to install/build/test/PR
/candid-ship --skip-install         # Skip dependency install
/candid-ship --skip-build           # Skip build verification
/candid-ship --skip-tests           # Skip test execution
/candid-ship --dry-run              # Show plan without executing
```

The workflow:
1. Pre-flight checks (gh CLI, git repo, branch validation)
2. Run candid-loop to review and fix code issues
3. Install dependencies (when ship.installCommand is configured)
4. Execute configured build command
5. Execute configured test command
6. Create pull request via gh CLI
7. Optionally update issue tracker (Linear) via MCP
8. Optionally auto-merge via gh pr merge --squash --auto
