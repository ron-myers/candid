# Shared Ship Workflow

Steps shared between `candid-ship` and `candid-fast-ship`. Each calling skill decides **whether** each step runs (via its `--skip-*` flags or `fastShip.*` toggles). This document defines **how** each step runs once that decision is made.

## Conventions

**Skip output:** When a step is skipped, output `Skipping [step name] ([reason])`. The reason is whatever the calling skill says — an active flag (`--skip-build`), config absence (`buildCommand not configured`), toggle off (`not enabled in fastShip config`), etc.

**Step numbering:** The calling skill computes `totalSteps` = count of steps that will actually execute. Each running step displays `Step [N]/[totalSteps]: ...` where `N` is the active step number among only the running steps.

**Fail-fast:** Any non-zero exit from review/install/build/tests aborts the ship with `[Step] failed. Ship aborted.` and shows command output. The exception is post-PR steps (issue tracker, auto-merge, post-merge) — those warn but never abort, since the PR already exists.

---

## Pre-Flight Checks

Run all three checks in one bash invocation:

```bash
gh auth status >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git branch --show-current
```

Map outcomes to aborts:
- First failure (gh) → `Pre-flight failed: GitHub CLI (gh) is not installed or not authenticated.` Tell the user: install at https://cli.github.com/ and authenticate with `gh auth login`.
- Second failure (git rev-parse) → `Pre-flight failed: Not inside a git repository.`
- Empty stdout (no current branch) → `Pre-flight failed: Detached HEAD state. Check out a branch first.`

On success, store stdout as `currentBranch`.

---

## Load Configuration

Read `.candid/config.json` once with the Read tool and parse it as JSON in memory. Extract every field the calling skill needs in a single pass. If the relevant top-level field (`ship` or `fastShip`) is absent, repeat with `~/.candid/config.json`. If neither file has it, apply defaults.

For field types, defaults, and validation rules see `skills/candid-review/CONFIG.md` (the `ship` and `fastShip` sections). The defaults summarized:

- `ship.buildCommand`, `ship.testCommand`, `ship.installCommand`, `ship.additionalPrompt`, `ship.postMergeCommand` → `null` (skip the step if not set)
- `ship.targetBranch` → first `mergeTargetBranches` entry, else `"main"`
- `ship.autoMerge` → `false`
- `ship.issueTracker.provider` → `"linear"`; `enabled` → `false`; `teamPrefixes` → `["DIS", "ENG", "DISC"]`; `state` → `"In Review"`; `prompt` → see CONFIG.md (the default codifies four invariants)
- `fastShip.review`, `build`, `tests`, `install`, `issueTracker`, `autoMerge`, `postMergeCommand` → `false`

### Resolve targetBranch

Priority: caller's explicit `targetBranch` (e.g. `fastShip.targetBranch` or `ship.targetBranch`) → first `mergeTargetBranches` entry → `"main"`.

Resolve to a concrete ref, **preferring `origin/[targetBranch]` when it exists** so that a stale local branch doesn't silently include already-shipped commits:

```bash
target_ref=$(git rev-parse --verify origin/[targetBranch] 2>/dev/null || git rev-parse --verify [targetBranch] 2>/dev/null)
```
If `target_ref` is empty, abort: `Target branch "[targetBranch]" does not exist locally or on remote.`

Use `target_ref` (not the bare branch name) for every subsequent diff/log comparison in this workflow.

### Validate Branch State

If `currentBranch == targetBranch`: abort with `Cannot ship: you are on the target branch ([targetBranch]). Check out a feature branch first.`

Check commits ahead:
```bash
git rev-list --count $target_ref..HEAD
```
If `0`: abort with `No commits ahead of [targetBranch]. Nothing to ship.`

---

## Display Plan

Both skills render the plan with this box. The calling skill supplies `[Header]`, the `[STATUS]` text per row (its enablement/skip semantics), and the renumbering-note wording.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Header]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Branch: [currentBranch] → [targetBranch]

Steps (numbers assigned dynamically — only [running | enabled+configured] steps get a number):
  [N]. 🔍 Review code (candid-loop)           [STATUS]
  [N]. 🛠️  Install: [installCommand]          [STATUS]
  [N]. 🔨 Build: [buildCommand]               [STATUS]
  [N]. 🧪 Tests: [testCommand]                [STATUS]
  [N]. 📋 Create pull request
  [N]. 🎯 Update issue tracker ([provider])   [STATUS]
  [N]. 🔀 Auto-merge                          [STATUS]
  [N]. 🚀 Post-merge: [postMergeCommand]      [STATUS]
```

Row variations:
- **candid-ship** appends `: state="[state]"` to the issue-tracker row (shown only if `issueTracker.enabled`), and renders the auto-merge row as `🔀 Auto-merge: enabled` or `🔀 Auto-merge: disabled`.
- **candid-fast-ship** uses the rows as-is with its `[ENABLED | SKIPPED — ...]` statuses.

---

## Install Dependencies

Display:
```
Step [N]/[totalSteps]: Installing dependencies...
$ [installCommand]
```

Execute the install command. On non-zero exit: `Install failed. Ship aborted.` Show output and abort. On success: `Install passed.`

---

## Run Review (candid-loop)

Display:
```
Step [N]/[totalSteps]: Running code review...
```

Invoke `candid-loop` via the Skill tool. If `additionalPrompt` is set, prepend this instruction before invoking:
> "IMPORTANT: During this review, also consider the following additional context: [additionalPrompt]"

After candid-loop completes, check its summary:
- **PASS** (no issues remaining) → continue. Output: `Review passed.`
- **INCOMPLETE** (max iterations reached, issues remain) → use AskUserQuestion: "Review completed with remaining issues. Continue shipping?" with options "Yes, continue anyway" / "No, abort". On "No, abort": exit with `Ship aborted: unresolved review issues.`
- **CANCELLED** → abort with `Ship aborted: review was cancelled.`

---

## Run Build

Display:
```
Step [N]/[totalSteps]: Running build...
$ [buildCommand]
```

Execute. On non-zero exit: `Build failed. Ship aborted.` Show output and abort. On success: `Build passed.`

---

## Run Tests

Display:
```
Step [N]/[totalSteps]: Running tests...
$ [testCommand]
```

Execute. On non-zero exit: `Tests failed. Ship aborted.` Show output and abort.

On success, verify before declaring: extract the runner's own counts from the output (e.g. "Tests: 42 passed", "12 passing") and report `Tests passed (<N> tests, exit 0).` If the exit code is 0 but the output shows zero tests executed ("No tests found", "0 passed", empty match pattern), treat it as a FAILURE: `Test command matched zero tests — nothing was verified. Ship aborted.` Never print `Tests passed.` without the count and exit code from the run you just executed.

---

## Create Pull Request

Display:
```
Step [N]/[totalSteps]: Creating pull request...
```

### Read commits once

Use the `target_ref` resolved in "Resolve targetBranch" — preferring `origin/[targetBranch]` so a stale local branch doesn't pollute the PR body with already-shipped commits.

```bash
git log $target_ref..HEAD --pretty=format:"%s"
```

Store output as `commitSubjects` (one commit subject per line).

### Generate Title

- **Single line:** use verbatim (truncate to 70 chars).
- **Multiple lines:** derive from `currentBranch`:
  - Strip prefix (`feature/`, `fix/`, `[username]/`, etc.)
  - Replace `-` and `_` with spaces
  - Capitalize first letter
  - Truncate to 70 chars
  - Example: `feature/add-auth-middleware` → `Add auth middleware`

### Generate Body

```markdown
## Summary
[each line of commitSubjects prefixed with "- "]

## Verification
- Install: [PASS | SKIPPED]
- Review: [PASS — N iterations, M issues fixed | SKIPPED]
- Build: [PASS | SKIPPED]
- Tests: [PASS | SKIPPED]

---
*Shipped with [candid-ship](https://github.com/ron-myers/candid)*
```

Omit any Verification row whose step was skipped. (Or keep with `SKIPPED` — match the calling skill's footer convention.)

### Push and Create

```bash
git push -u origin [currentBranch]
```
On failure, abort with the error message.

```bash
gh pr create --base [targetBranch] --title "[title]" --body "[body]"
```
Capture stdout as the PR URL. On failure, abort with the error message.

Output: `PR created: [URL]`

---

## Update Issue Tracker

The issue-tracker step is post-PR — it warns on every failure mode but never aborts.

### Skip Conditions

The calling skill resolves its own enable toggle (`ship.issueTracker.enabled` for candid-ship, `fastShip.issueTracker` for candid-fast-ship) before invoking this section. Once invoked, skip silently with the matching reason:

- `ship.issueTracker` config absent → `No issue tracker configured — skipping`
- Caller's enable toggle is `false` → `Skipping issue tracker update (disabled)`
- `provider` is `"none"` → `Skipping issue tracker update (provider set to "none")`
- `provider` is anything other than `"linear"` → warn `⚠️  Issue tracker provider "[provider]" is not yet supported. Request support at: https://github.com/ron-myers/candid/issues` and skip
- Linear MCP tool (`mcp__claude_ai_Linear__save_issue`) unavailable → `Linear MCP not available — skipping issue update`

### Extract Issue Identifier

Build a case-insensitive regex from `teamPrefixes`:
```
pattern = (PREFIX1|PREFIX2|...)-\d+
```
Match against `currentBranch`. Examples with `["DIS", "ENG", "DISC"]`:
- `ron-myers/dis-509-add-auth` → `DIS-509`
- `feature/ENG-1234-fix-login` → `ENG-1234`
- `feature/refactor-auth` → no match

If no match: `No issue ID found in branch name — skipping`. **Not an error.** Branches without a tracked issue ship normally.

If matched, normalize to uppercase.

### Render the Prompt

Substitute `{issueId}`, `{state}`, `{provider}` in `issueTracker.prompt`. The default prompt encodes four invariants (single-issue, single-field, idempotent, no fallback search) — see `skills/candid-review/CONFIG.md` for the full text.

### Pre-Call Invariant Check

Custom prompts that strip the single-issue restriction risk fan-out. Treat the rendered prompt as preserving the invariant only if it contains one of (case-insensitive): `"only this one issue"`, `"only this single issue"`, `"only one issue"`, `"this issue only"`. If none match:
```
⚠️  Issue tracker prompt is missing the single-issue restriction.
Refusing to call the MCP. Restore the invariant in `ship.issueTracker.prompt` (see candid-ship docs).
```
Skip the MCP call. The structured `id` argument enforces single-issue scope from the API side; the prompt check is defense-in-depth.

### Call the MCP (Linear)

```
mcp__claude_ai_Linear__save_issue
  id: "[matched issue ID]"
  state: "[issueTracker.state]"
```

The structured `id` is authoritative; the rendered prompt shapes Claude's intent.

- **Success:** `Updated [issueId] → [state]` (e.g. `Updated DIS-509 → In Review`)
- **Error** (issue not found, permission, bad state name, etc.): warn `⚠️  Issue tracker update failed: [error message]. PR is still open at: [URL]` and continue.

---

## Auto-Merge

Display:
```
Step [N]/[totalSteps]: Enabling auto-merge...
```

```bash
gh pr merge [PR_URL] --squash --auto
```

- **Success:** `Auto-merge enabled. PR will merge when checks pass.`
- **Failure** (e.g. repo doesn't allow auto-merge): warn `⚠️  Auto-merge failed: [error message]. The repository may not have auto-merge enabled in Settings → General → Pull Requests. PR is still open at: [URL]`. Continue — the PR exists.

---

## Post-Merge Command

Display:
```
Step [N]/[totalSteps]: Running post-merge command...
$ [postMergeCommand]
```

Execute. On non-zero exit: warn `⚠️  Post-merge command failed: [error output]. PR is still merging at: [URL]`. Continue. On success: `Post-merge command completed.`

---

## Display Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Candid Ship Complete | Candid Fast Ship Complete]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Install:  [PASS | SKIPPED]
Review:   [PASS (N iterations, M issues fixed) | SKIPPED]
Build:    [PASS | SKIPPED]
Tests:    [PASS | SKIPPED]
PR:       [URL]
Issue:    [Updated DIS-509 → In Review | Skipped — <reason> | Failed: <error>]   (only if issue tracker enabled)
Merge:    [Auto-merge enabled | Manual merge required | Auto-merge failed]
Post-merge: [PASS | SKIPPED | FAILED | N/A]
```

Omit the `Install:` row if `installCommand` was not configured. Omit the `Issue:` row if the issue tracker was not enabled.
