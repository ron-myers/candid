---
name: candid-ship
description: Ship your changes - review, build, test, create PR, and optionally auto-merge
---

# Candid Ship

Orchestrate the full shipping workflow: review code via candid-loop, run build and tests, create a GitHub PR, and optionally auto-merge. Aborts on any failure.

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

Load ship configuration from CLI flags and config files.

**Precedence (highest to lowest):**
1. CLI flags
2. Project config (`.candid/config.json` → `ship` field)
3. User config (`~/.candid/config.json` → `ship` field)
4. Defaults

#### Parse CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--auto-merge` | Enable auto-merge | from config |
| `--no-auto-merge` | Disable auto-merge | from config |
| `--skip-review` | Skip candid-loop step | `false` |
| `--skip-build` | Skip build command | `false` |
| `--skip-tests` | Skip test command | `false` |
| `--dry-run` | Show plan without executing | `false` |

If both `--auto-merge` and `--no-auto-merge` are provided, `--no-auto-merge` wins.

#### Check Project Config

```bash
jq -r '.ship // null' .candid/config.json 2>/dev/null
```

If the `ship` field exists, extract:
- `buildCommand` (string) — shell command for build verification
- `testCommand` (string) — shell command for tests
- `targetBranch` (string) — PR target branch
- `autoMerge` (boolean) — auto-merge after PR creation
- `additionalPrompt` (string) — extra context for candid-loop/review
- `postMergeCommand` (string) — shell command to run after auto-merge succeeds

Output when loading: `Using ship settings from project config`

#### Check User Config

Same procedure for `~/.candid/config.json` if project config doesn't have `ship` field.

Output when loading: `Using ship settings from user config`

#### Resolve targetBranch Default

If `targetBranch` is not set by config:
1. Check `mergeTargetBranches` in project config → use first entry
2. Check `mergeTargetBranches` in user config → use first entry
3. Default to `"main"`

Verify the target branch exists:
```bash
git rev-parse --verify [targetBranch] 2>/dev/null || git rev-parse --verify origin/[targetBranch] 2>/dev/null
```

If target branch doesn't exist: abort with `Target branch "[targetBranch]" does not exist locally or on remote.`

#### Apply Defaults

For any options not set:
```
buildCommand = null (skip build if not set)
testCommand = null (skip tests if not set)
targetBranch = resolved per above
autoMerge = false
additionalPrompt = null
postMergeCommand = null (skip if not set)
```

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

Show what will be executed:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candid Ship Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Branch: [currentBranch] → [targetBranch]

Steps:
  1. 🔍 Review code (candid-loop)           [or SKIP]
  2. 🔨 Build: [buildCommand]               [or SKIP — not configured]
  3. 🧪 Tests: [testCommand]                [or SKIP — not configured]
  4. 📋 Create pull request
  5. 🔀 Auto-merge: enabled                 [or disabled]
  6. 🚀 Post-merge: [postMergeCommand]      [or SKIP — not configured]
```

If `additionalPrompt` is set:
```
Review context: "[additionalPrompt]"
```

**If `--dry-run`:**
Output: `Dry run complete. No changes made.`
Exit.

**If not dry-run:** Use AskUserQuestion:

**Question:** "Proceed with this shipping plan?"

**Options:**
1. "Yes, ship it"
2. "No, cancel"

If "No, cancel": exit with `Ship cancelled.`

### Step 4: Run Review (candid-loop)

**Skip if** `--skip-review` flag is set. Output: `Skipping review (--skip-review)`

Display:
```
Step 1/5: Running code review...
```

Invoke candid-loop via the Skill tool: `/candid-loop`

If `additionalPrompt` is set, include it in the skill invocation by adding this instruction before invoking:
> "IMPORTANT: During this review, also consider the following additional context: [additionalPrompt]"

After candid-loop completes, check its summary output:

- **If PASS** (no issues remaining): continue. Output: `Review passed.`
- **If INCOMPLETE** (max iterations reached with remaining issues): Use AskUserQuestion:
  - **Question:** "Review completed with remaining issues. Continue shipping?"
  - **Options:**
    1. "Yes, continue anyway"
    2. "No, abort"
  - If "No, abort": exit with `Ship aborted: unresolved review issues.`
- **If CANCELLED**: abort with `Ship aborted: review was cancelled.`

### Step 5: Run Build

**Skip if** `--skip-build` flag is set OR `buildCommand` is not configured.

If skipped due to no config: Output: `Skipping build (not configured)`
If skipped due to flag: Output: `Skipping build (--skip-build)`

Display:
```
Step 2/5: Running build...
$ [buildCommand]
```

Execute the build command:
```bash
[buildCommand]
```

**If build fails** (non-zero exit code):
```
Build failed. Ship aborted.
```
Show the build output so the user can diagnose.
Abort.

**If build succeeds:**
```
Build passed.
```

### Step 6: Run Tests

**Skip if** `--skip-tests` flag is set OR `testCommand` is not configured.

If skipped due to no config: Output: `Skipping tests (not configured)`
If skipped due to flag: Output: `Skipping tests (--skip-tests)`

Display:
```
Step 3/5: Running tests...
$ [testCommand]
```

Execute the test command:
```bash
[testCommand]
```

**If tests fail** (non-zero exit code):
```
Tests failed. Ship aborted.
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
Step 4/5: Creating pull request...
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
*Shipped with [candid-ship](https://github.com/ron-myers/candid)*
```

#### 7.3: Push Branch

Ensure the branch is pushed to remote:

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

### Step 8: Auto-Merge (Optional)

**Skip if** `autoMerge` is `false`. Output: `Auto-merge: disabled (manual merge required)`

If `autoMerge` is `true`:

Display:
```
Step 5/5: Enabling auto-merge...
```

```bash
gh pr merge [PR_URL] --squash --auto
```

If auto-merge fails (e.g., repo doesn't have auto-merge enabled):
```
⚠️  Auto-merge failed: [error message]
The repository may not have auto-merge enabled in Settings → General → Pull Requests.
PR is still open at: [URL]
```
Do NOT abort — the PR was already created. Continue to summary.

If auto-merge succeeds:
```
Auto-merge enabled. PR will merge when checks pass.
```

### Step 9: Run Post-Merge Command (Conditional)

**Skip if** `postMergeCommand` is not configured. Output: `Skipping post-merge command (not configured)`

**Skip if** `autoMerge` is `false`. Output: `Skipping post-merge command (auto-merge disabled)`

**Skip if** auto-merge failed in Step 8. Output: `Skipping post-merge command (auto-merge failed)`

If all conditions are met (command configured, auto-merge enabled, auto-merge succeeded):

Display:
```
Step 6/6: Running post-merge command...
$ [postMergeCommand]
```

Execute the post-merge command:
```bash
[postMergeCommand]
```

**If command fails** (non-zero exit code):
```
⚠️  Post-merge command failed: [error output]
PR is still merging at: [URL]
```
Do NOT abort — the PR was already created and auto-merge is enabled. Continue to summary.

**If command succeeds:**
```
Post-merge command completed.
```

### Step 10: Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candid Ship Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review:   [PASS (N iterations, M issues fixed) | SKIPPED]
Build:    [PASS | SKIPPED]
Tests:    [PASS | SKIPPED]
PR:       [URL]
Merge:    [Auto-merge enabled | Manual merge required | Auto-merge failed]
Post-merge: [PASS | SKIPPED | FAILED | N/A]
```

## Configuration

### Config File Schema

Add to `.candid/config.json`:

```json
{
  "version": 1,
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "stable",
    "autoMerge": false,
    "additionalPrompt": "Focus on security and ensure all API endpoints have auth middleware",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger"
  }
}
```

### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ship.buildCommand` | string | `null` | Shell command for build verification. Skip if not set. |
| `ship.testCommand` | string | `null` | Shell command for running tests. Skip if not set. |
| `ship.targetBranch` | string | first `mergeTargetBranches` or `"main"` | Branch to target for PR. |
| `ship.autoMerge` | boolean | `false` | Auto-merge PR after creation via `gh pr merge --squash --auto`. |
| `ship.additionalPrompt` | string | `null` | Extra context passed to candid-loop/review. |
| `ship.postMergeCommand` | string | `null` | Shell command to run after auto-merge succeeds. Skipped if auto-merge is disabled or fails. |

### Examples

**Minimal — just PR creation:**
```json
{
  "ship": {
    "targetBranch": "main"
  }
}
```

**Full CI pipeline with auto-merge:**
```json
{
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "stable",
    "autoMerge": true,
    "additionalPrompt": "Ensure error handling covers all async operations",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger"
  }
}
```

**Python project:**
```json
{
  "ship": {
    "buildCommand": "python -m py_compile src/**/*.py",
    "testCommand": "pytest -v",
    "targetBranch": "main",
    "autoMerge": false
  }
}
```

## CLI Examples

```bash
# Ship with all defaults from config
/candid-ship

# Force auto-merge
/candid-ship --auto-merge

# Quick ship — skip review, just build/test/PR
/candid-ship --skip-review

# See what would happen without doing it
/candid-ship --dry-run

# Skip everything except PR creation
/candid-ship --skip-review --skip-build --skip-tests
```

## Remember

The goal of candid-ship is to **automate the entire shipping workflow** so you can go from code to merged PR with one command.

**Fail-fast principle:** Any failure (review incomplete, build fail, test fail) aborts immediately with a clear message. The only exception is auto-merge failure — the PR is already created and shouldn't be wasted.

**Pre-flight checks:** Always validate the environment before starting. It's frustrating to complete a full review + build + test cycle only to discover gh isn't installed.
