---
name: candid-fast-ship
description: Fast ship for low-risk changes — runs only the steps you explicitly enable in fastShip config
---

# Candid Fast Ship

A minimal shipping path for low-risk changes. Unlike `candid-ship`, which runs all steps by default and lets you opt out, `candid-fast-ship` runs **nothing by default** and only executes the steps you explicitly enable in the `fastShip` configuration block.

Step configuration (commands, target branch, issue tracker details) is inherited from the existing `ship` block. `fastShip` is purely a set of on/off toggles that sit on top of it.

## Workflow

Execute these steps in order:

### Step 1: Pre-Flight Checks

Verify the environment is ready for shipping.

#### 1.1: Check gh CLI

```bash
gh auth status 2>&1
```

If command fails or `gh` not found:
```
Pre-flight failed: GitHub CLI (gh) is not installed or not authenticated.
Install: https://cli.github.com/
Authenticate: gh auth login
```
Abort.

#### 1.2: Check Git Repository

```bash
git rev-parse --is-inside-work-tree 2>&1
```

If not inside a git repo: abort with `Pre-flight failed: Not inside a git repository.`

#### 1.3: Check Current Branch

```bash
git branch --show-current
```

Store as `currentBranch`. If empty (detached HEAD): abort with `Pre-flight failed: Detached HEAD state. Check out a branch first.`

### Step 2: Load Configuration

Load `fastShip` toggles from config and `ship` field for command values.

**Precedence (highest to lowest):**
1. CLI flags
2. Project config (`.candid/config.json` → `fastShip` field)
3. User config (`~/.candid/config.json` → `fastShip` field)
4. Defaults (all steps disabled)

#### Parse CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--auto-merge` | Enable auto-merge (overrides fastShip config) | from config |
| `--no-auto-merge` | Disable auto-merge (overrides fastShip config) | from config |
| `--dry-run` | Show plan without executing | `false` |

If both `--auto-merge` and `--no-auto-merge` are provided, `--no-auto-merge` wins.

#### Check Project Config — fastShip Field

```bash
jq -r '.fastShip // null' .candid/config.json 2>/dev/null
```

If the `fastShip` field exists, extract these boolean toggles (all default to `false` if absent):
- `review` (boolean) — run candid-loop code review
- `build` (boolean) — run build command
- `tests` (boolean) — run test command
- `issueTracker` (boolean) — update issue tracker
- `autoMerge` (boolean) — enable auto-merge
- `postMergeCommand` (boolean) — run post-merge shell command
- `targetBranch` (string) — PR target branch override

Output when loading: `Using fastShip settings from project config`

#### Check User Config — fastShip Field

Same procedure for `~/.candid/config.json` if project config doesn't have a `fastShip` field.

Output when loading: `Using fastShip settings from user config`

#### Load ship Field for Command Values

```bash
jq -r '.ship // null' .candid/config.json 2>/dev/null
```

Load from project config → user config → defaults. Extract:
- `buildCommand` — used when `fastShip.build` is enabled
- `testCommand` — used when `fastShip.tests` is enabled
- `targetBranch` — fallback if `fastShip.targetBranch` not set
- `additionalPrompt` — passed to candid-loop if `fastShip.review` is enabled
- `postMergeCommand` — used when `fastShip.postMergeCommand` is enabled
- `issueTracker` — full issueTracker config object, used when `fastShip.issueTracker` is enabled

#### Resolve targetBranch

Priority: `fastShip.targetBranch` → `ship.targetBranch` → `mergeTargetBranches[0]` → `"main"`

Verify the target branch exists:
```bash
git rev-parse --verify [targetBranch] 2>/dev/null || git rev-parse --verify origin/[targetBranch] 2>/dev/null
```

If target branch doesn't exist: abort with `Target branch "[targetBranch]" does not exist locally or on remote.`

#### Validate Current Branch != Target Branch

If `currentBranch == targetBranch`:
```
Cannot ship: you are on the target branch ([targetBranch]). Check out a feature branch first.
```
Abort.

#### Check Commits Ahead

```bash
git log --oneline [targetBranch]..HEAD 2>/dev/null | head -20
```

If no commits ahead: abort with `No commits ahead of [targetBranch]. Nothing to ship.`

### Step 3: Display Plan

Determine which steps are enabled and configured. A step is **ENABLED** only when its toggle is `true` AND (for build/tests/postMerge) the corresponding command is set in `ship`, or (for issueTracker) `ship.issueTracker` is present with a supported provider.

Calculate `totalSteps` as the count of steps that will actually execute (PR creation always counts as 1; add 1 for each enabled+configured optional step).

Renumber displayed steps to skip any that are fully skipped.

Show what will be executed:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candid Fast Ship Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Branch: [currentBranch] → [targetBranch]

Steps:
  1. 🔍 Review code (candid-loop)           [ENABLED | SKIPPED — not enabled]
  2. 🔨 Build: [buildCommand]               [ENABLED | SKIPPED — not enabled | SKIPPED — not configured]
  3. 🧪 Tests: [testCommand]                [ENABLED | SKIPPED — not enabled | SKIPPED — not configured]
  4. 📋 Create pull request
  5. 🎯 Update issue tracker ([provider])   [ENABLED | SKIPPED — not enabled | SKIPPED — not configured]
  6. 🔀 Auto-merge                          [ENABLED | SKIPPED — not enabled]
  7. 🚀 Post-merge: [postMergeCommand]      [ENABLED | SKIPPED — not enabled | SKIPPED — not configured]
```

If all optional steps are disabled:
```
  (All optional steps disabled — only PR creation will run)
```

**If `--dry-run`:**
Output: `Dry run complete. No changes made.`
Exit.

**If not dry-run:** Use AskUserQuestion:

**Question:** "Proceed with this fast ship plan?"

**Options:**
1. "Yes, ship it"
2. "No, cancel"

If "No, cancel": exit with `Fast ship cancelled.`

### Step 4: Run Review (Optional)

**Skip if** `fastShip.review` is `false`. Output: `Skipping review (not enabled in fastShip config)`

Display:
```
Step [N]/[totalSteps]: Running code review...
```

Invoke candid-loop via the Skill tool: `/candid-loop`

If `additionalPrompt` is set (from `ship.additionalPrompt`), include it:
> "IMPORTANT: During this review, also consider the following additional context: [additionalPrompt]"

After candid-loop completes, check its summary output:

- **If PASS**: continue. Output: `Review passed.`
- **If INCOMPLETE** (max iterations reached with remaining issues): Use AskUserQuestion:
  - **Question:** "Review completed with remaining issues. Continue shipping?"
  - **Options:**
    1. "Yes, continue anyway"
    2. "No, abort"
  - If "No, abort": exit with `Fast ship aborted: unresolved review issues.`
- **If CANCELLED**: abort with `Fast ship aborted: review was cancelled.`

### Step 5: Run Build (Optional)

**Skip if** `fastShip.build` is `false`. Output: `Skipping build (not enabled in fastShip config)`

**Skip if** `fastShip.build` is `true` but `ship.buildCommand` is not set. Output: `Skipping build (buildCommand not configured in ship)`

Display:
```
Step [N]/[totalSteps]: Running build...
$ [buildCommand]
```

Execute the build command:
```bash
[buildCommand]
```

**If build fails** (non-zero exit code):
```
Build failed. Fast ship aborted.
```
Show the build output so the user can diagnose.
Abort.

**If build succeeds:**
```
Build passed.
```

### Step 6: Run Tests (Optional)

**Skip if** `fastShip.tests` is `false`. Output: `Skipping tests (not enabled in fastShip config)`

**Skip if** `fastShip.tests` is `true` but `ship.testCommand` is not set. Output: `Skipping tests (testCommand not configured in ship)`

Display:
```
Step [N]/[totalSteps]: Running tests...
$ [testCommand]
```

Execute the test command:
```bash
[testCommand]
```

**If tests fail** (non-zero exit code):
```
Tests failed. Fast ship aborted.
```
Show the test output so the user can diagnose.
Abort.

**If tests succeed:**
```
Tests passed.
```

### Step 7: Create Pull Request

Display:
```
Step [N]/[totalSteps]: Creating pull request...
```

#### 7.1: Generate PR Title

```bash
git log [targetBranch]..HEAD --oneline
```

- **Single commit:** Use that commit message as the title
- **Multiple commits:** Clean the branch name into a title:
  - Remove prefix (e.g., `feature/`, `fix/`, `ron-myers/`)
  - Replace hyphens/underscores with spaces
  - Capitalize first letter
  - Example: `feature/add-auth-middleware` → `Add auth middleware`

Truncate title to 70 characters if needed.

#### 7.2: Generate PR Body

```bash
git log [targetBranch]..HEAD --pretty=format:"- %s"
```

Assemble the body:

```markdown
## Summary
[commit list from git log]

## Verification
- Review: [PASS — N iterations, M issues fixed | SKIPPED]
- Build: [PASS | SKIPPED]
- Tests: [PASS | SKIPPED]

---
*Shipped with [candid-fast-ship](https://github.com/ron-myers/candid)*
```

#### 7.3: Push Branch

```bash
git push -u origin [currentBranch]
```

If push fails, abort with error message.

#### 7.4: Create PR

```bash
gh pr create --base [targetBranch] --title "[title]" --body "[body]"
```

Capture the PR URL from stdout. If creation fails, abort with error message.

Output: `PR created: [URL]`

### Step 8: Update Issue Tracker (Optional)

**Skip if** `fastShip.issueTracker` is `false`. Output: `Skipping issue tracker (not enabled in fastShip config)`

**Skip if** `fastShip.issueTracker` is `true` but `ship.issueTracker` is not present in config. Output: `Skipping issue tracker (issueTracker not configured in ship)`

**Skip if** `ship.issueTracker.provider` is `"none"`. Output: `Skipping issue tracker update (provider set to "none")`

**Skip if** `ship.issueTracker.provider` is anything other than `"linear"`:
```
⚠️  Issue tracker provider "[provider]" is not yet supported.
Request support at: https://github.com/ron-myers/candid/issues
```
Continue to Step 9.

**Skip if** `ship.issueTracker.provider` is `"linear"` but the Linear MCP tool (`mcp__claude_ai_Linear__save_issue`) is unavailable. Output: `Linear MCP not available — skipping issue update`

Note: `fastShip.issueTracker: true` acts as the enable toggle — `ship.issueTracker.enabled` is ignored in fast ship mode.

If enabled and configured, proceed using the same logic as candid-ship Step 8 (extract issue ID from branch name, render prompt, pre-call invariant check, call MCP).

Display:
```
Step [N]/[totalSteps]: Updating issue tracker ([provider])...
```

Use `ship.issueTracker.teamPrefixes`, `ship.issueTracker.state`, and `ship.issueTracker.prompt` for the update.

**On success:** Output: `Updated [issueId] → [state]`

**On error:**
```
⚠️  Issue tracker update failed: [error message]
PR is still open at: [URL]
```
Do NOT abort.

### Step 9: Auto-Merge (Optional)

**Skip if** `fastShip.autoMerge` is `false`. Output: `Auto-merge: disabled (manual merge required)`

If `fastShip.autoMerge` is `true`:

Display:
```
Step [N]/[totalSteps]: Enabling auto-merge...
```

```bash
gh pr merge [PR_URL] --squash --auto
```

If auto-merge fails:
```
⚠️  Auto-merge failed: [error message]
The repository may not have auto-merge enabled in Settings → General → Pull Requests.
PR is still open at: [URL]
```
Do NOT abort.

If auto-merge succeeds:
```
Auto-merge enabled. PR will merge when checks pass.
```

### Step 10: Run Post-Merge Command (Optional)

**Skip if** `fastShip.postMergeCommand` is `false`. Output: `Skipping post-merge command (not enabled in fastShip config)`

**Skip if** `fastShip.postMergeCommand` is `true` but `ship.postMergeCommand` is not set. Output: `Skipping post-merge command (postMergeCommand not configured in ship)`

**Skip if** `fastShip.autoMerge` is `false`. Output: `Skipping post-merge command (auto-merge not enabled)`

**Skip if** auto-merge failed in Step 9. Output: `Skipping post-merge command (auto-merge failed)`

If all conditions are met:

Display:
```
Step [N]/[totalSteps]: Running post-merge command...
$ [postMergeCommand]
```

Execute:
```bash
[postMergeCommand]
```

**If command fails:**
```
⚠️  Post-merge command failed: [error output]
PR is still merging at: [URL]
```
Do NOT abort.

**If command succeeds:**
```
Post-merge command completed.
```

### Step 11: Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candid Fast Ship Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review:   [PASS (N iterations, M issues fixed) | SKIPPED]
Build:    [PASS | SKIPPED]
Tests:    [PASS | SKIPPED]
PR:       [URL]
Issue:    [Updated DIS-509 → In Review | Skipped | Failed: <error>]
Merge:    [Auto-merge enabled | Manual merge required | Auto-merge failed]
Post-merge: [PASS | SKIPPED | FAILED | N/A]
```

## Configuration

### fastShip Config Block

Add to `.candid/config.json` alongside the `ship` field:

```json
{
  "fastShip": {
    "review": false,
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

Command values, target branch, and issue tracker configuration are inherited from the `ship` block — `fastShip` only controls which steps run.

### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fastShip.review` | boolean | `false` | Run candid-loop code review before creating PR. |
| `fastShip.build` | boolean | `false` | Run `ship.buildCommand` before creating PR. Skipped if `ship.buildCommand` is not set. |
| `fastShip.tests` | boolean | `false` | Run `ship.testCommand` before creating PR. Skipped if `ship.testCommand` is not set. |
| `fastShip.issueTracker` | boolean | `false` | Update issue tracker after PR creation. Uses `ship.issueTracker` for provider/state/prompt config. Skipped if `ship.issueTracker` is not configured. |
| `fastShip.autoMerge` | boolean | `false` | Auto-merge PR after creation via `gh pr merge --squash --auto`. |
| `fastShip.postMergeCommand` | boolean | `false` | Run `ship.postMergeCommand` after auto-merge succeeds. Skipped if `ship.postMergeCommand` is not set or auto-merge is not enabled. |
| `fastShip.targetBranch` | string | `ship.targetBranch` or first `mergeTargetBranches` or `"main"` | PR target branch. |

### Examples

**Minimal — just create a PR:**
```json
{
  "fastShip": {}
}
```

**Build check + PR only:**
```json
{
  "fastShip": {
    "build": true
  }
}
```

**Build + auto-merge (no review, no tests):**
```json
{
  "fastShip": {
    "build": true,
    "autoMerge": true
  }
}
```

**Docs change — just PR and issue tracker update:**
```json
{
  "fastShip": {
    "issueTracker": true,
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
