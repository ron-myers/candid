---
name: candid-ship
description: Ship your changes - review, build, test, create PR, and optionally auto-merge
---

# Candid Ship

Orchestrate the full shipping workflow: review code via candid-loop, run install/build/tests, create a GitHub PR, optionally update an issue tracker and auto-merge. Aborts on any failure before PR creation.

`candid-ship` runs all configured steps **by default** — the user opts out with `--skip-*` flags. (Compare `candid-fast-ship`, which is opt-in.)

## Workflow

Execute these steps in order. The mechanics for each step are defined in `skills/candid-ship/WORKFLOW.md`. This file specifies the **skip semantics** unique to `candid-ship`.

### Step 1: Pre-Flight Checks

Run the pre-flight checks from WORKFLOW.md → "Pre-Flight Checks".

### Step 2: Load Configuration

Read config per WORKFLOW.md → "Load Configuration", extracting these `ship.*` fields plus `mergeTargetBranches`:

`buildCommand`, `testCommand`, `installCommand`, `targetBranch`, `autoMerge`, `additionalPrompt`, `postMergeCommand`, `issueTracker` (full sub-tree).

When loading from project config, output: `Using ship settings from project config`. From user config: `Using ship settings from user config`.

#### Parse CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--auto-merge` | Enable auto-merge | from config |
| `--no-auto-merge` | Disable auto-merge | from config |
| `--skip-review` | Skip candid-loop step | `false` |
| `--skip-install` | Skip install step | `false` |
| `--skip-build` | Skip build command | `false` |
| `--skip-tests` | Skip test command | `false` |
| `--dry-run` | Show plan without executing | `false` |

If both `--auto-merge` and `--no-auto-merge` are provided, `--no-auto-merge` wins.

After loading, run the `targetBranch` resolution and branch-state validation from WORKFLOW.md → "Resolve targetBranch" / "Validate Branch State".

### Step 3: Display Plan

Calculate `totalSteps` = 1 (PR creation always runs) + number of optional steps that will run. An optional step counts when:
- `review`: `--skip-review` is not set
- `install`: `--skip-install` is not set AND `installCommand` is set
- `build`: `--skip-build` is not set AND `buildCommand` is set
- `tests`: `--skip-tests` is not set AND `testCommand` is set
- `issueTracker`: `issueTracker.enabled` is `true`
- `autoMerge`: `autoMerge` is `true`
- `postMergeCommand`: `autoMerge` is `true` AND `postMergeCommand` is set

Renumber the displayed step list to skip rows for any disabled optional steps.

Render the plan per WORKFLOW.md → "Display Plan": header `Candid Ship Plan`, statuses `[or SKIP]` / `[or SKIP — not configured]` per the enablement rules above.

If `additionalPrompt` is set, append: `Review context: "[additionalPrompt]"`.

**If `--dry-run`:** Output `Dry run complete. No changes made.` and exit.

**Otherwise:** Use AskUserQuestion: "Proceed with this shipping plan?" with options "Yes, ship it" / "No, cancel". On "No, cancel": exit with `Ship cancelled.`

### Steps 4-7: Review, Install, Build, Tests

Run in order: review, install, build, tests. For each: skip if its `--skip-*` flag is set → `Skipping [step] (--skip-[step])`; skip install/build/tests if the corresponding command is not configured → `Skipping [step] (not configured)`; otherwise execute the matching WORKFLOW.md section ("Run Review (candid-loop)", "Install Dependencies", "Run Build", "Run Tests").

### Step 8: Create Pull Request

Always runs. Execute WORKFLOW.md → "Create Pull Request".

### Step 9: Update Issue Tracker

Execute WORKFLOW.md → "Update Issue Tracker". The skip conditions there map directly to ship's behavior. Notes:

- The default `teamPrefixes` (`DIS`, `ENG`, `DISC`) reflect one Linear workspace. **Edit `ship.issueTracker.teamPrefixes` in `.candid/config.json` to match your workspace's team keys.**
- The default `prompt` encodes four invariants (single-issue, single-field, idempotent, no fallback search). Custom prompts must preserve "single issue" and "no fallback search" or the pre-call check will refuse the call.

### Step 10: Auto-Merge

**Skip if** `autoMerge` is `false` → `Auto-merge: disabled (manual merge required)`. Otherwise execute WORKFLOW.md → "Auto-Merge".

### Step 11: Post-Merge Command

**Skip if** `postMergeCommand` is not configured → `Skipping post-merge command (not configured)`. Skip if `autoMerge` is `false` → `Skipping post-merge command (auto-merge disabled)`. Skip if auto-merge failed in Step 10 → `Skipping post-merge command (auto-merge failed)`. Otherwise execute WORKFLOW.md → "Post-Merge Command".

### Step 12: Summary

Execute WORKFLOW.md → "Display Summary" with header `Candid Ship Complete`.

## Configuration

### Config File Schema

Add to `.candid/config.json`:

```json
{
  "version": 1,
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "installCommand": "pnpm install",
    "targetBranch": "stable",
    "autoMerge": false,
    "additionalPrompt": "Focus on security and ensure all API endpoints have auth middleware",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS", "ENG", "DISC"],
      "state": "In Review"
    }
  }
}
```

### Field Reference

Types, defaults, and validation live in `skills/candid-review/CONFIG.md` (`ship` section); WORKFLOW.md → "Load Configuration" summarizes the defaults.

> **Note:** `issueTracker` is an optional integration. When omitted, the issue-tracker step is skipped silently — the rest of the ship runs unchanged. To request support for another tracker (Asana, Jira, GitHub Issues, etc.), open an issue at https://github.com/ron-myers/candid/issues.

### Examples

**Minimal — just PR creation:**
```json
{ "ship": { "targetBranch": "main" } }
```

**Full pipeline with install, auto-merge, and Linear:**
```json
{
  "ship": {
    "installCommand": "pnpm install",
    "buildCommand": "pnpm build",
    "testCommand": "pnpm test",
    "targetBranch": "stable",
    "autoMerge": true,
    "additionalPrompt": "Ensure error handling covers all async operations",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS", "ENG"],
      "state": "In Review"
    }
  }
}
```

## CLI Examples

```bash
# Ship with all defaults from config
/candid-ship

# Force auto-merge
/candid-ship --auto-merge

# Quick ship — skip review, just install/build/test/PR
/candid-ship --skip-review

# Skip install (deps already up to date)
/candid-ship --skip-install

# See what would happen without doing it
/candid-ship --dry-run

# PR only
/candid-ship --skip-review --skip-install --skip-build --skip-tests
```

## Remember

Fail-fast: any pre-PR failure aborts immediately; post-PR steps (issue tracker, auto-merge, post-merge) warn but never abort — the PR already exists. Set `installCommand` (e.g. `npm ci`) so build/test failures reflect real code issues, not missing dependencies.
