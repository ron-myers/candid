---
name: candid-chrome-qa-fix
description: Take a candid-chrome-qa findings JSON, let the user pick which findings to fix, and dispatch fixes — single batched PR, one PR per finding via Conductor deep links, local-only, or issues-only. Optionally files Linear (or other tracker) issues per finding before shipping.
---

# Candid Chrome QA Fix

Consume a `candid-chrome-qa` findings file (v2.0 schema) and turn it into actual code fixes — with optional issue-tracker filing.

This is a **technique skill**. Follow the order. Sit alongside `/candid-chrome-qa` (the producer) and `/candid-loop` (the analogue for `candid-review` issues).

## Workflow

Execute these steps in order.

### Step 1: Resolve the findings file

Precedence (highest to lowest):

1. CLI flag `--file <path>` — use that exact file. If it doesn't exist or isn't readable, abort.
2. Latest file by mtime in `.context/findings/*.json`.
3. If `.context/findings/` is empty/missing, output the message below and stop:

   ```
   No findings file found in .context/findings/
   Run /candid-chrome-qa first, then re-run /candid-chrome-qa-fix.
   ```

If multiple files share the latest mtime within 5 minutes (i.e., 2+ recent runs), list the top 3 with their `context.scope` and `context.createdAt`:

```
Multiple recent findings files. Pick one:
  1. 2026-04-25 18:30 — Agent Config / AI Setup, all 16 tabs (.context/findings/2026-04-25-agent-config-ai-setup.json)
  2. 2026-04-25 16:12 — Dashboard analytics polish (.context/findings/2026-04-25-1612-dashboard-analytics-polish.json)
  3. 2026-04-24 21:05 — Mobile-only smoke (.context/findings/2026-04-24-mobile-only-smoke.json)
```

Use `AskUserQuestion` with options for each file plus "Use the latest" and "Cancel".

### Step 2: Validate the schema

Parse the JSON. Validate:

- `schemaVersion === "2.0"`. If not, abort with:

  ```
  Findings file uses schemaVersion "<value>" — this skill targets v2.0.
  Re-run /candid-chrome-qa to regenerate, or pass an explicit --file from a v2.0 producer.
  ```

- `findings` is an array.
- `context.scope` and `context.createdAt` exist.

If any required per-finding field is missing on any finding (`id`, `severity`, `category`, `surface`, `viewport`, `url`, `title`, `repro`, `expected`, `actual`, `suggestedFix`, `groupHint`, `confidence`, `capturedAt`), warn but proceed — surface the malformed entries in the summary and skip them from the selection list.

### Step 3: Filter & summarize

Build the **fixable list**:

1. Drop findings where `title` starts with `"✓ no issues"` or `severity === "P5"` AND `confidence === "definite"` and `category === "ux"` (those are coverage receipts emitted by chrome-qa for clean targets — not bugs).
2. Apply CLI filters if present:
   - `--severity P0,P1` → keep only matching severities.
   - `--category bug,a11y` → keep only matching categories.
3. Sort by severity (P0 → P5), then by `groupHint`, then by `capturedAt` ascending.

Print the summary:

```
Findings file: .context/findings/<filename>.json
Scope: <context.scope>
Captured: <context.createdAt>

Fixable: <N>
  Severity: P0=<n> P1=<n> P2=<n> P3=<n> P4=<n>
  Category: bug=<n> a11y=<n> perf=<n> ux=<n> copy=<n> security=<n> compat=<n>
```

If `Fixable === 0`, print `Nothing to fix — every finding is a coverage receipt or filtered out.` and stop.

### Step 4: Multi-select UI ("checkbox list") — hybrid

`AskUserQuestion` supports `multiSelect: true` (true checkbox UX). Use it conditionally based on the fixable count.

Print the numbered list first, regardless of branch:

```
[ ] 1. [P0] [bug] Save button does nothing on Voice tab — F-a3f29b71
       /dashboard/agents/agent_123/voice
       Fix: Surface the form validation error in the UI; current handler swallows it
[ ] 2. [P1] [a11y] Icon button missing label on Header — F-7c29f912
       …
```

#### Step 4a: ≤ 15 fixable — native multi-select

Call `AskUserQuestion` with `multiSelect: true`. Question: `"Which findings would you like to fix? (multi-select)"`. Options, in order:

1. `"All P0 + P1"` (skip if there are zero P0+P1)
2. `"All fixable"`
3. One option per finding, formatted: `"[<severity>] [<category>] <title> — <id>"` (truncate titles past 80 chars)

Do NOT add an `"Other"` option — the harness auto-injects free-form input. Do NOT add `"Cancel"` — the user can hit Esc.

Resolve the user's selections:
- If "All P0 + P1" was selected, expand to every P0 and P1 finding.
- If "All fixable" was selected, expand to every fixable finding.
- Otherwise, the picked options map directly to findings by ID.
- De-duplicate. Preserve severity-then-capture-order.

#### Step 4b: > 15 fixable — bulk presets + custom indices

Call `AskUserQuestion` with single-select. Options:

1. `"All fixable"` (N findings)
2. `"All P0 + P1"` (only if there are P0+P1)
3. `"All P0 + P1 + P2"`
4. `"Custom selection"` — opens a free-form input prompt
5. `"Cancel"`

If "Custom selection", prompt with: `"Enter indices or finding IDs (comma-separated, ranges OK). Examples: 1,3,5-8 or F-a3f29b71,F-7c29f912"`. Parse:

- Split on commas.
- For each token: integer → index into the fixable list; `N-M` → range; `F-...` → ID lookup.
- Reject (and ask again) if any token doesn't resolve.

Either path: confirm the resolved selection with one more `AskUserQuestion`:

```
Selected <N> findings to fix:
  • F-a3f29b71 [P0] Save button does nothing
  • F-7c29f912 [P1] Icon button missing label
  …
Proceed?
```

Options: `"Yes — proceed"`, `"No — re-pick"`, `"Cancel"`.

### Step 5: Strategy selection

Skip this step if `--strategy` was passed. Otherwise:

If `selected.length <= 3`, default to `batched` and skip the prompt. Otherwise ask via `AskUserQuestion`:

```
How would you like to ship these fixes?
```

Options:

1. `"One batched PR"` — apply all fixes sequentially in this workspace; single PR at the end.
2. `"One PR per finding (parallel via Conductor)"` — emit a `conductor://` deep link per finding to spawn isolated Conductor workspaces that fix in parallel.
3. `"Apply locally only"` — fix everything in this workspace; no PR.
4. `"File issues only — don't fix"` — create a tracker issue per finding; no code changes.

CLI override: `--strategy batched|per-finding|local|issues-only`.

### Step 6: Issue tracker decision

Skip this step if `strategy === "issues-only"` (issues are always created in that strategy).

Resolve the issue-tracker enable flag (precedence highest to lowest):

1. CLI flag `--no-create-issues` → disabled.
2. CLI flag `--create-issues` → enabled.
3. `.candid/config.json` → `chromeQAFix.issueTracker.enabled` → use that.
4. Default: disabled.

If still disabled, skip this step.

If enabled, ask via `AskUserQuestion`:

```
Also file these findings in your tracker?
```

Options:

1. `"Yes — one issue per selected finding"` (linked from the PR)
2. `"Yes — only for findings I'm NOT fixing right now"` (track for later — only present if there are unselected fixable findings)
3. `"No — code fixes only, skip tracker"`

Outcome — store one of:
- `"all-selected"` — create issues for every finding in the selection.
- `"unselected-only"` — create issues for fixable findings NOT in the selection.
- `"none"` — skip tracker step.

### Step 7: Create tracker issues (runs BEFORE any code change)

Skip if Step 6 outcome is `"none"` AND `strategy !== "issues-only"`.

Issue creation **must run before** code edits / PR / deep-link spawn so issue IDs flow into commits, PR titles/bodies, and per-finding spawned-workspace prompts.

Provider dispatch — read `chromeQAFix.issueTracker.provider` from config:

| Provider | Behavior |
|---|---|
| `linear` | Run the Linear flow defined in `WORKFLOW.md` → `Create Issue From Finding (Linear)`. |
| `github` / `jira` / `asana` | Warn `⚠️  Issue tracker provider "<provider>" is not yet supported. Request support at: https://github.com/ron-myers/candid/issues` and skip. Code fixes still proceed. |
| `none` or unset | Silently skip. |

For supported providers, iterate the issue-creation list (selected, unselected, or all-selected per Step 6 / `--strategy issues-only`):

1. Run the **dedup probe** (skip if `issueTracker.dedupe === false`) — see WORKFLOW.md → `Linear Dedup Probe`.
2. If a single match is found, reuse it (`Reused existing issue [TEAM-123] for F-...`) and continue.
3. Else, build the payload (see WORKFLOW.md → `Linear Payload`) and call `mcp__claude_ai_Linear__save_issue`.
4. Capture `{ findingId, issueId, url, status: "created" | "reused" | "failed" | "skipped-ambiguous" }` into the **issue map**.

Pre-create confirmation: if creating ≥ 5 new issues, show the list and ask `"Create N issues in <provider>:<teamKey>? (Y/n)"` via `AskUserQuestion`.

After the loop, print:

```
Issues filed: <created> (reused: <reused>, failed: <failed>, skipped: <skipped>)
```

The issue map is passed to the strategy step.

### Step 8: Execute strategy

#### Step 8a: Batched mode (sequential, single PR)

For each selected finding, in severity order (P0 first, then P1, …):

1. Print the finding's `id`, `severity`, `category`, `title`, `repro`, `expected`, `actual`, `suggestedFix`, and any `evidence.filesLikelyTouched`.
2. Read the files in `evidence.filesLikelyTouched`. If a path doesn't exist, log `[WARN] F-... — filesLikelyTouched path missing: <path>` and skip the finding (mark as failed in the summary).
3. Apply the smallest change that resolves `actual` to match `expected`, using `suggestedFix` as guidance. NEVER write outside `evidence.filesLikelyTouched` without surfacing it explicitly.
4. Append a one-line entry to `.context/findings/<base>.fixes.md` (create if missing): `<ISO-timestamp> | F-<id> | <title> | <files-changed>`.

After all selected findings:

5. If `chromeQAFix.testCommand` is set, run it. If it fails, print the error and ask: `"Tests failed. (a) Stop and let me debug, (b) Continue and ship anyway, (c) Stop and rollback?"` via `AskUserQuestion`. On (c), restore from `git stash`.
6. Build the PR title and body:
   - **Title** (≤ 72 chars): if issue map has Linear IDs, `"Fix N QA findings (TEAM-123, TEAM-124, …): <top finding title>"`. Otherwise `"Fix N QA findings: <top finding title>"`. Truncate to 72 with `…`.
   - **Body**: see template in Step 8d below.
7. Hand off to `/candid-fast-ship` (if `--fast` is set) or `/candid-ship` for the single PR. Pass `--skip-review` since we just edited deliberate fixes — re-reviewing them with `candid-loop` is duplicative and slow. Pass the title and body.
8. Capture the PR URL.

#### Step 8b: Per-finding mode (Conductor deep links, parallel)

Pre-conditions:

- `process.platform === "darwin"` (Conductor is Mac-only). If not, force `--print-links` and warn `Conductor is Mac-only — falling back to --print-links.`
- Resolve the deep-link `path` parameter (precedence): `chromeQAFix.conductorRepoPath` → derive from `git remote get-url origin` repo name → ask the user once and offer to save into `.candid/config.json` if neither resolves.

For each selected finding:

1. Generate the branch slug: lowercase the finding's title, replace non-alphanumerics with `-`, collapse repeated `-`, trim trailing `-`, truncate to **22 chars** (so the full `<prefix>/qa-fix-<slug>` stays ≤ 30 chars when the prefix is short).
2. Build the branch name: `<chromeQAFix.branchPrefix or git config user.name slug>/qa-fix-<slug>`. If the prefix is missing, use the git user's email local-part lowercased, non-alnum → `-`.
3. Substitute placeholders in the **per-finding spawned-workspace prompt** (below).
4. URL-encode the resulting prompt with full `encodeURIComponent` semantics — newlines, quotes, JSON braces, equals signs all encoded. Use Bash `jq -rR @uri` or Python's `urllib.parse.quote(..., safe='')` — NEVER hand-roll string substitution.
5. URL-encode the `path` value.
6. Build the deep link: `conductor://prompt=<encoded-prompt>&path=<encoded-path>`
7. **`--print-links` mode**: print the deep link with the finding ID and branch name, do NOT `open` it.
8. **Default mode**: `open "<deep-link>"` via Bash. After every `chromeQAFix.maxParallel` (default 4) launches, sleep 2s before the next batch to avoid Conductor race conditions on rapid spawn.

After dispatching all links, print:

```
Conductor workspaces launched: <N>
  F-a3f29b71 → ron-myers/qa-fix-voice-save-button → conductor://...
  F-7c29f912 → ron-myers/qa-fix-icon-button-no-label → conductor://...
  …

Each workspace will: rename branch → fix → test → commit → push → ship PR.
There is no callback — check Conductor for progress.
```

The parent skill exits at this point. The actual fixing happens in parallel inside Conductor's workspaces.

##### Per-finding spawned-workspace prompt template

Substitute every `{{placeholder}}` with the literal value:

```
You're fixing a single Chrome QA finding in a fresh Conductor workspace.

First action: rename the auto-named branch to `{{branchName}}` via `git branch -m {{branchName}}`.

Finding (v2.0 schema):
{{finding-json}}

{{#if linearIssueUrl}}
Linear issue: {{linearIssueUrl}}
Reference this issue in the commit body and PR description.
{{/if}}

Steps:
1. Rename the branch as above.
2. Read the files listed in evidence.filesLikelyTouched.
3. Apply the smallest change that resolves `actual` to match `expected`, using `suggestedFix` as guidance.
4. If `.candid/config.json` has `chromeQAFix.testCommand` set, run it. Fix or stop on failure — do NOT proceed past failing tests.
5. Commit with message: "Fix QA: {{title}}"
   Body must include:
     Finding: F-{{id}}
     URL: {{url}}
     Repro: {{repro-first-line}}
     {{#if linearIssueUrl}}Closes {{linearIssueId}}{{/if}}
6. Push the branch.
7. Run /candid-fast-ship to open the PR. Title: "Fix QA: {{title}}". Body must include the finding ID, the original URL, and the Linear issue link if present. (candid-fast-ship is opt-in by default — review is already disabled unless explicitly enabled in fastShip config, so no extra flag is needed.)
8. Print the PR URL when done.

DO NOT modify files unrelated to this finding. DO NOT touch other findings' files.
```

#### Step 8c: Local-only mode

Run Step 8a's per-finding loop (steps 1–4) but stop before Step 8a/5 (test command, PR creation). Print a summary of files changed. The fixes remain uncommitted in the working tree for the user to review.

#### Step 8d: PR body template (used by 8a)

```
## QA fixes from `<findings-file-path>`

Origin: `/candid-chrome-qa` pass on <context.scope>, captured <context.createdAt>.

### Fixes

- {{#if linearId}}[{{linearId}}]({{linearUrl}}) — {{/if}}**F-{{id}}** [{{severity}}] {{title}}
  - Surface: `{{surface}}` ({{viewport}})
  - URL: {{url}}
{{#each ...}}
{{/each}}

---

_Filed by `/candid-chrome-qa-fix` — do not edit this footer; the matching findings file is at `<findings-file-path>`._
```

### Step 9: Final summary

Always print, regardless of strategy:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Candid Chrome QA Fix — Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Findings file: <path>
Strategy:      batched | per-finding | local | issues-only
Selected:      <N>
Fixed:         <M>
Failed:        <P>
Skipped:       <Q>
Issues filed:  <I> created, <R> reused, <F> failed   (omit row if tracker disabled)

Per finding:
  ✓ F-a3f29b71 [P0] Save button does nothing — PR: https://github.com/.../pull/123 | Issue: TEAM-1234
  ✓ F-7c29f912 [P1] Icon button missing label — applied locally | Issue: reused TEAM-1180
  ✗ F-2bff1004 [P1] Stale state on org switch — failed (test failure: <line>) | Issue: TEAM-1235
  ◦ F-9af00103 [P2] Touch target too small — issues-only | Issue: TEAM-1236
  → F-1c00abcd [P1] Settings save loop — Conductor: ron-myers/qa-fix-settings-save-loop
```

Glyph legend: `✓` = fixed + shipped (or applied), `✗` = fix failed, `◦` = issues-only / no fix attempted, `→` = dispatched to Conductor (per-finding mode).

Omit the `Issue:` column entirely if `issueTracker.enabled === false` or `provider !== "linear"`.

**Exit code:** non-zero on any **fix** failure (`✗`). Issue-create failures warn but don't change the exit code (mirrors candid-ship's post-PR semantics).

## Configuration

### Config File Schema

Add to `.candid/config.json`:

```json
{
  "version": 1,
  "chromeQAFix": {
    "defaultStrategy": "batched",
    "maxParallel": 4,
    "testCommand": "npm test",
    "branchPrefix": "ron-myers",
    "conductorRepoPath": "candid-v1",
    "issueTracker": {
      "enabled": false,
      "provider": "linear",
      "teamKey": "ENG",
      "state": "Backlog",
      "labels": ["qa-finding", "chrome-qa"],
      "priorityMap": { "P0": 1, "P1": 2, "P2": 3, "P3": 3, "P4": 4, "P5": 0 },
      "dedupe": true,
      "prompt": "Create one Linear issue from this single QA finding only — this issue only. Do not create issues for any other findings. Do not search for or update any other Linear issues. Use the structured payload exactly."
    }
  }
}
```

### Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultStrategy` | string | `"batched"` | One of `"batched"`, `"per-finding"`, `"local"`, `"issues-only"`. Used when no `--strategy` flag is passed and selection > 3. |
| `maxParallel` | number | `4` | Per-finding deep-link launch batch size. Sleeps 2s between batches. |
| `testCommand` | string | `null` | Run after batched/local fixes. Skipped if `null`. |
| `branchPrefix` | string | git user | Prefix for spawned-workspace branch names (`<prefix>/qa-fix-<slug>`). |
| `conductorRepoPath` | string | derived | Value for the `path` query param of `conductor://` deep links. |
| `issueTracker.enabled` | boolean | `false` | Master switch for the create-issue step. |
| `issueTracker.provider` | string | `"linear"` | One of `"linear"`, `"github"`, `"jira"`, `"asana"`, `"none"`. Only `"linear"` is implemented today. |
| `issueTracker.teamKey` | string | none | **Required** when `provider === "linear"` and `enabled === true`. Linear team key (e.g. `"ENG"`). |
| `issueTracker.state` | string | `"Backlog"` | Initial state for new issues. |
| `issueTracker.labels` | array | `["qa-finding", "chrome-qa"]` | Base labels. The finding's `category` is appended at create time. |
| `issueTracker.priorityMap` | object | see schema | Map from finding severity to Linear priority (0=No-priority…4=Low; 1=Urgent). |
| `issueTracker.dedupe` | boolean | `true` | If true, search for existing issues with the same `F-id` before creating. |
| `issueTracker.prompt` | string | see schema | Encodes the **single-issue invariant**. Custom prompts must contain one of `"only this one issue"`, `"only this single issue"`, `"only one issue"`, `"this issue only"`. |

### Examples

**Minimal — just batched fixes, no tracker:**
```json
{ "chromeQAFix": { "testCommand": "npm test" } }
```

**Linear, dedup on, default state:**
```json
{
  "chromeQAFix": {
    "issueTracker": {
      "enabled": true,
      "provider": "linear",
      "teamKey": "DIS",
      "labels": ["qa-finding", "chrome-qa", "from-claude"]
    }
  }
}
```

**Force local-only by default with issues filed (review then ship manually):**
```json
{
  "chromeQAFix": {
    "defaultStrategy": "local",
    "issueTracker": { "enabled": true, "provider": "linear", "teamKey": "ENG" }
  }
}
```

## CLI Examples

```bash
# Resolve latest findings file, prompt for selection and strategy
/candid-chrome-qa-fix

# Specific file, only P0 + P1 findings
/candid-chrome-qa-fix --file .context/findings/2026-04-25-agent-config-ai-setup.json --severity P0,P1

# Per-finding mode — emit deep links but don't open them (dry run)
/candid-chrome-qa-fix --strategy per-finding --print-links

# File-only mode (no fixes) — file every fixable finding into Linear
/candid-chrome-qa-fix --strategy issues-only

# Batched + Linear issues + override team
/candid-chrome-qa-fix --strategy batched --create-issues --tracker-team DIS

# Force-disable tracker even if config has it on
/candid-chrome-qa-fix --no-create-issues
```

## CLI Flags

| Flag | Description |
|---|---|
| `--file <path>` | Use a specific findings file (skip latest-resolution). |
| `--severity P0,P1` | Only consider these severities. |
| `--category bug,a11y` | Only consider these categories. |
| `--strategy batched\|per-finding\|local\|issues-only` | Skip the strategy prompt. |
| `--max-parallel N` | Override the per-finding deep-link launch batch size. |
| `--print-links` | In per-finding mode, print deep links instead of `open`-ing them. |
| `--fast` | In batched mode, hand off to `/candid-fast-ship` instead of `/candid-ship`. |
| `--create-issues` | Force-enable issue creation (overrides config). |
| `--no-create-issues` | Force-disable issue creation (overrides config). |
| `--tracker-team <KEY>` | Override `issueTracker.teamKey` for this run. |

## Hard Rules — do not violate

1. **Never silently fix without user selection.** Always present the multi-select prompt unless `--strategy` AND a non-interactive selector (`--severity`, `--category`, or both passed together with all matching findings selected) explicitly target a known set.
2. **Never `open` Conductor deep links on a non-macOS host.** Force `--print-links` mode and warn.
3. **Never write outside `evidence.filesLikelyTouched`** without explicitly noting the extra files in the per-finding summary line.
4. **Never claim a fix is shipped without a PR URL** in the final summary (batched/local; per-finding mode legitimately exits before PRs exist).
5. **Never assume v1 schema.** Validate `schemaVersion === "2.0"` and stop with a clear error otherwise.
6. **Never URL-encode the deep link incorrectly.** Use a real URL-encoder (`jq @uri`, Python `quote(safe='')`, etc.) — never hand-roll. Newlines, quotes, JSON braces, and `&` all need encoding.
7. **Never spawn more than `maxParallel` Conductor workspaces in a single burst.** Sleep 2s between batches.
8. **Never create a Linear issue without the single-issue invariant** present in the rendered prompt — refuse the MCP call. (Mirrors `candid-ship`'s defense-in-depth.)
9. **Never silently fan out tracker creation.** If creating ≥ 5 new issues, confirm the count and target team before the first `mcp__claude_ai_Linear__save_issue` call. If `issueTracker.dedupe === true`, run the dedup probe first.
10. **Never proceed with `provider !== "linear"`** in v1 — warn with the standard "request support" message and skip the tracker step. Code fixes still proceed.
11. **Never embed secrets** (env vars, tokens, cookies, auth headers, request bodies) in issue descriptions, commit messages, or deep-link prompts. Only the structured finding fields are safe — and even those: redact anything in `evidence` that looks like a credential before serializing.

## Common rationalizations — STOP if you catch yourself

| Excuse | Reality |
|--------|---------|
| "I'll skip the schema check; the file looks fine" | v1 fields silently dropped break the workflow — title is `tag` in v1, repro/expected/actual don't exist. Validate. |
| "I'll fix the file even though it's not in `filesLikelyTouched`" | Mark it in the summary so the user can verify. Don't hide unexpected edits. |
| "I'll URL-encode the prompt by replacing spaces with `%20`" | JSON braces, quotes, newlines, and `&` will break the deep link. Use a real encoder. |
| "Issue tracker can fail silently — the PR is what matters" | Issue creation IS the source of truth for some teams. Print failures explicitly in the summary. |
| "I'll skip the dedup probe to save an API call" | A second `/candid-chrome-qa-fix` run on the same findings file will create duplicates. Always probe unless explicitly disabled. |
| "Conductor isn't installed; I'll just run the fixes here" | The user picked per-finding for a reason. Print the deep links so they can fix it elsewhere or copy-paste them. |
| "Per-finding mode without macOS — I'll use git worktrees instead" | That's a different feature. Print links and exit. Do not silently swap the implementation. |
| "I'll create one Linear issue summarizing all findings" | Single-issue invariant. One finding = one issue. |
| "I'll auto-approve the PR since the fix is small" | Never. The PR is the user's review surface — never auto-approve. |

## Related skills

- `/candid-chrome-qa` — produces the v2.0 findings file this skill consumes.
- `/candid-loop` — analogous "fix issues in a loop" skill, but for `candid-review` output rather than chrome-qa.
- `/candid-fast-ship` and `/candid-ship` — invoked at the end of batched mode (and inside each per-finding spawned workspace) to open PRs.

## Provider-specific implementation

See `WORKFLOW.md` for the **Create Issue From Finding** contract and the Linear-specific dedup probe + payload schema. Future provider implementations (GitHub Issues, Jira, Asana) plug into the same contract.
