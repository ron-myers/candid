---
name: candid-fast-ship
description: Fast ship for low-risk changes — runs only the steps you explicitly enable in fastShip config
---

# Candid Fast Ship

A minimal shipping path for low-risk changes. Unlike `candid-ship`, which runs all steps by default and lets you opt out, `candid-fast-ship` runs **nothing by default** — only steps explicitly enabled in the `fastShip` config block. PR creation always runs.

Step configuration (commands, target branch, issue tracker details) is inherited from the existing `ship` block. `fastShip` is purely a set of on/off toggles that sit on top of it.

## Workflow

Execute these steps in order. The mechanics for each step are defined in `skills/candid-ship/WORKFLOW.md`. This file specifies the **toggle semantics** unique to `candid-fast-ship`.

### Step 1: Pre-Flight Checks

Run the pre-flight checks from WORKFLOW.md → "Pre-Flight Checks".

### Step 2: Load Configuration

Read config per WORKFLOW.md → "Load Configuration", with two top-level fields:
- `fastShip.*` — the boolean toggles (see CLI Flags table below for the schema)
- `ship.*` — command values, target branch, issue tracker config (inherited)

When loading from project config, output: `Using fastShip settings from project config`. From user config: `Using fastShip settings from user config`.

#### Parse CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--auto-merge` | Enable auto-merge (overrides `fastShip.autoMerge`) | from config |
| `--no-auto-merge` | Disable auto-merge (overrides `fastShip.autoMerge`) | from config |
| `--dry-run` | Show plan without executing | `false` |

If both `--auto-merge` and `--no-auto-merge` are provided, `--no-auto-merge` wins.

#### Resolve targetBranch

Priority: `fastShip.targetBranch` → `ship.targetBranch` → first `mergeTargetBranches` entry → `"main"`. Then run target-branch verification and branch-state validation per WORKFLOW.md → "Resolve targetBranch" / "Validate Branch State".

### Step 3: Display Plan

A step is **enabled** only when its `fastShip` toggle is `true` AND the underlying `ship` config is present:

| Toggle | Required `ship` config |
|--------|------------------------|
| `fastShip.review` | (none — always runnable when enabled) |
| `fastShip.install` | `ship.installCommand` |
| `fastShip.build` | `ship.buildCommand` |
| `fastShip.tests` | `ship.testCommand` |
| `fastShip.issueTracker` | `ship.issueTracker` with supported provider |
| `fastShip.autoMerge` | (none) |
| `fastShip.postMergeCommand` | `ship.postMergeCommand` AND `fastShip.autoMerge: true` |

Calculate `totalSteps` = 1 (PR creation) + count of enabled steps. Renumber displayed step rows so disabled steps don't take a number.

Render the plan per skills/candid-ship/WORKFLOW.md → "Display Plan": header `Candid Fast Ship Plan`, statuses `[ENABLED | SKIPPED — not enabled | SKIPPED — not configured]`.

If all optional steps are disabled, append `(All optional steps disabled — only PR creation will run)`.

**If `--dry-run`:** Output `Dry run complete. No changes made.` and exit.

**Otherwise:** Use AskUserQuestion: "Proceed with this fast ship plan?" with options "Yes, ship it" / "No, cancel". On "No, cancel": exit with `Fast ship cancelled.`

### Step 4: Run Review

**Skip if** `fastShip.review` is `false` → `Skipping review (not enabled in fastShip config)`. Otherwise execute WORKFLOW.md → "Run Review (candid-loop)". Use `ship.additionalPrompt` if set.

### Steps 5-7: Install, Build, Tests

For each of install/build/tests: skip if its `fastShip.[step]` toggle is `false` → `Skipping [step] (not enabled in fastShip config)`; skip if the toggle is `true` but the corresponding `ship` command (`installCommand`/`buildCommand`/`testCommand`) is unset → `Skipping [step] ([commandField] not configured in ship)`; otherwise execute the matching WORKFLOW.md section ("Install Dependencies", "Run Build", "Run Tests").

### Step 8: Create Pull Request

Always runs. Execute WORKFLOW.md → "Create Pull Request". Footer should read `*Shipped with [candid-fast-ship](https://github.com/ron-myers/candid)*`.

### Step 9: Update Issue Tracker

**Skip if** `fastShip.issueTracker` is `false` → `Skipping issue tracker (not enabled in fastShip config)`. Skip if `ship.issueTracker` is absent → `Skipping issue tracker (issueTracker not configured in ship)`.

Otherwise execute WORKFLOW.md → "Update Issue Tracker", using `ship.issueTracker.*` for provider, state, prompt, and team prefixes.

**Note:** `fastShip.issueTracker: true` acts as the enable toggle — `ship.issueTracker.enabled` is ignored in fast-ship mode.

### Step 10: Auto-Merge

**Skip if** `fastShip.autoMerge` is `false` → `Auto-merge: disabled (manual merge required)`. Otherwise execute WORKFLOW.md → "Auto-Merge".

### Step 11: Post-Merge Command

**Skip if** `fastShip.postMergeCommand` is `false` → `Skipping post-merge command (not enabled in fastShip config)`. Skip if `ship.postMergeCommand` is not set → `Skipping post-merge command (postMergeCommand not configured in ship)`. Skip if `fastShip.autoMerge` is `false` → `Skipping post-merge command (auto-merge not enabled)`. Skip if auto-merge failed in Step 10 → `Skipping post-merge command (auto-merge failed)`. Otherwise execute WORKFLOW.md → "Post-Merge Command".

### Step 12: Summary

Execute WORKFLOW.md → "Display Summary" with header `Candid Fast Ship Complete`.

## Configuration

### fastShip Config Block

Add to `.candid/config.json` alongside the `ship` field:

```json
{
  "fastShip": {
    "review": false,
    "install": false,
    "build": false,
    "tests": false,
    "issueTracker": false,
    "autoMerge": false,
    "postMergeCommand": false,
    "targetBranch": "stable"
  }
}
```

All fields are optional. Boolean fields default to `false`. `targetBranch` defaults to `ship.targetBranch` → `mergeTargetBranches[0]` → `"main"`.

For full validation rules see `skills/candid-review/CONFIG.md` (the `fastShip` section).

### Examples

**Minimal — just create a PR:**
```json
{ "fastShip": {} }
```

**Install + build + auto-merge:**
```json
{
  "ship": {
    "installCommand": "pnpm install",
    "buildCommand": "pnpm build"
  },
  "fastShip": {
    "install": true,
    "build": true,
    "autoMerge": true
  }
}
```

## CLI Examples

```bash
# Fast ship with fastShip config defaults
/candid-fast-ship

# Override auto-merge flag
/candid-fast-ship --auto-merge
/candid-fast-ship --no-auto-merge

# Preview plan without executing
/candid-fast-ship --dry-run
```

## Remember

`candid-fast-ship` is **opt-in by default** — nothing runs unless you explicitly enable it in `fastShip` config. Use it for low-risk changes where the full `candid-ship` review cycle would be overkill: hotfixes, docs updates, config changes, dependency bumps.

For anything that needs review, use `/candid-ship` or enable `fastShip.review: true`.
