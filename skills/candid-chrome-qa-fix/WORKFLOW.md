# Candid Chrome QA Fix — Provider Workflow

Provider-specific implementation details for `/candid-chrome-qa-fix` Step 7 (Create tracker issues).

The parent `SKILL.md` calls into one section here per finding: `Create Issue From Finding (<provider>)`. Each provider must implement the same contract.

## Contract

Every provider must satisfy:

```
input:  finding       — full v2.0 finding object
        config        — chromeQAFix.issueTracker block (provider-specific overrides nested)
        findingsFilePath — string path the finding came from (for breadcrumb in description)
        dedupe        — boolean (config.dedupe, with --create-issues / --no-create-issues respected)
        teamKey       — config.teamKey (with --tracker-team override applied)

output: { findingId, issueId, url, status }
        status ∈ {"created", "reused", "failed", "skipped-ambiguous"}
        For "failed", include `error: <message>`.
```

The parent skill aggregates outputs into the issue map and stitches issue IDs into PR titles, PR bodies, commit bodies, and per-finding deep-link prompts.

## Create Issue From Finding (Linear)

Linear is the only provider implemented in v1.

### Step 1 — Linear Dedup Probe

Runs only if `config.dedupe === true`.

Call `mcp__claude_ai_Linear__list_issues` filtered by team key. Use the structured `team` parameter when supported; otherwise pass the team key in the natural-language prompt with the same single-issue-search invariant.

The probe asks: "Find any issue in team `<teamKey>` whose title or description contains `F-<id>`."

| Result | Action |
|---|---|
| Zero matches | Proceed to create. |
| One match | Reuse: capture the issue's `id` and `url`. Output: `Reused existing issue [TEAM-1234] for F-<id>`. Set status `"reused"`. |
| Two or more matches | Skip create. Output: `⚠️  Multiple issues match F-<id> — skipping create. Resolve manually: <comma-separated ids>`. Set status `"skipped-ambiguous"`. |

The probe MUST be by F-id (not by title) — finding titles can be edited in Linear and would no longer match, but F-ids are deterministic SHA-1 outputs of `<url>|<title>` and are stable across re-runs.

### Step 2 — Linear Payload

Build the payload from the finding:

| Linear field | Source |
|---|---|
| `team` | `config.teamKey` (string). **Required.** If absent, abort the issue-tracker step entirely with: `⚠️  issueTracker.teamKey is required for provider "linear" — set it in .candid/config.json or pass --tracker-team. Skipping tracker step.` |
| `title` | `"[QA] " + finding.title` (truncated to 100 chars if needed; never split mid-word). |
| `description` | The markdown template below. |
| `priority` | `config.priorityMap[finding.severity]` (default map: `{P0:1, P1:2, P2:3, P3:3, P4:4, P5:0}`). Linear scale: 0=No-priority, 1=Urgent, 2=High, 3=Medium, 4=Low. |
| `state` | `config.state` (default `"Backlog"`). The Linear MCP accepts state name; case-sensitive. |
| `labels` | `[...config.labels, finding.category]` deduplicated. Default labels: `["qa-finding", "chrome-qa"]`. |

#### Description template

```
**Finding ID:** F-{{id}}
**Severity:** {{severity}}
**Category:** {{category}}
**Surface:** `{{surface}}` ({{viewport}})
**URL:** {{url}}
**Confidence:** {{confidence}}

## Repro

{{repro}}

## Expected

{{expected}}

## Actual

{{actual}}

## Suggested fix

{{suggestedFix}}

{{#if evidence}}
## Evidence

<details>
<summary>Console / network / files touched</summary>

```json
{{evidence-json-pretty}}
```

</details>
{{/if}}

---

_Filed by `/candid-chrome-qa-fix` from `{{findingsFilePath}}`_
_Group hint: `{{groupHint}}` · Captured: {{capturedAt}}_
```

Substitution rules:

- `{{evidence-json-pretty}}` is `JSON.stringify(finding.evidence, null, 2)`.
- Omit the entire `## Evidence` block if `finding.evidence` is missing or empty.
- All values are inserted verbatim — Linear renders markdown.
- **Do NOT inject any value not present in the structured finding object.** No env vars, no shell expansions, no remote fetches. The finding is the only source of truth.

### Step 3 — Pre-call Single-Issue Invariant Check

The rendered prompt (the `prompt` template field, with placeholders substituted) MUST contain at least one of these phrases (case-insensitive):

- `"only this one issue"`
- `"only this single issue"`
- `"only one issue"`
- `"this issue only"`

If none match:

```
⚠️  Issue tracker prompt is missing the single-issue restriction.
Refusing to call the MCP. Restore the invariant in `chromeQAFix.issueTracker.prompt`
(see SKILL.md for the default prompt).
```

Skip the call. The structured payload also enforces single-issue scope (one MCP call = one issue), but the prompt check is **defense-in-depth** matching the candid-ship pattern.

### Step 4 — Call Linear MCP

```
mcp__claude_ai_Linear__save_issue
  team: "<teamKey>"
  title: "<rendered-title>"
  description: "<rendered-description>"
  priority: <number 0-4>
  state: "<state-name>"
  labels: [...]
```

**Important:** do NOT pass an `id` field — the absence of `id` is what makes this a create. (Passing `id` updates an existing issue, which is candid-ship's pattern, not ours.)

The natural-language prompt — sent alongside the structured payload — should be the rendered `config.issueTracker.prompt` (default in SKILL.md). The structured payload is authoritative; the prompt shapes Claude's intent.

| Outcome | Action |
|---|---|
| Success — returns `{id, url}` | Capture both. Status `"created"`. Output: `Created [TEAM-1234] for F-<id>` |
| Error (auth, validation, network) | Status `"failed"`. Capture error. Output: `⚠️  Failed to create issue for F-<id>: <error>`. Continue with the next finding — do NOT abort the whole loop. |

### Step 5 — Pre-fan-out Confirmation

If `dedupe` is enabled and the probe found zero matches for **all** N findings (so we're about to create N new issues), AND `N >= 5`:

```
About to create <N> issues in Linear team <teamKey>:
  • F-a3f29b71 — [QA] Save button does nothing on Voice tab
  • F-7c29f912 — [QA] Icon button missing label on Header
  …

Proceed?
```

`AskUserQuestion`: `"Yes — create all"`, `"No — cancel issue creation"`. On cancel, set every finding's status to `"skipped-by-user"` and proceed to fixes (do not abort the whole skill).

For `N < 5`, no confirmation needed — proceed.

## Create Issue From Finding (GitHub)

**Not yet implemented.** When invoked, output:

```
⚠️  Issue tracker provider "github" is not yet supported.
Request support at: https://github.com/ron-myers/candid/issues
Skipping tracker step. Code fixes will still proceed.
```

When implementing in a future PR, the contract surface is:

- Map finding to GitHub issue title + body
- Map severity to GitHub label (e.g., `priority:p0` … `priority:p5`)
- Use `gh issue create --repo <owner/repo> --title <title> --body <body> --label <labels>` via Bash (no GitHub MCP required)
- Dedup probe: `gh issue list --search "F-<id> in:body" --state all --json number,url,title`
- Output `{ id: "<owner>/<repo>#<number>", url, status }`

## Create Issue From Finding (Jira)

**Not yet implemented.** When invoked, output:

```
⚠️  Issue tracker provider "jira" is not yet supported.
Request support at: https://github.com/ron-myers/candid/issues
Skipping tracker step. Code fixes will still proceed.
```

Future contract: REST API via `JIRA_TOKEN` env var, project key from config, severity mapped to priority field, F-id stored in `customfield_xxxxx` for dedup.

## Create Issue From Finding (Asana)

**Not yet implemented.** When invoked, output:

```
⚠️  Issue tracker provider "asana" is not yet supported.
Request support at: https://github.com/ron-myers/candid/issues
Skipping tracker step. Code fixes will still proceed.
```

Future contract: Asana API via `ASANA_TOKEN`, project GID from config, severity mapped to custom field, F-id in description for dedup.

## Provider: "none"

Skip silently. Return `{ findingId, issueId: null, url: null, status: "skipped-disabled" }` for each finding. Used when the user wants the rest of the workflow but explicitly opts out of tracker integration.

## Implementation Notes

- **Each provider MUST run the dedup probe as a single MCP/CLI call**, not one per finding. For Linear: one `list_issues` call per team scoped to a regex of all F-ids if the MCP supports it; otherwise one call per finding (slower but correct). Prefer batched if available.
- **Issue creation is sequential, not parallel.** Linear MCP rate limits hit fast under bursty creation, and per-finding ordering is observable in the issue map. Sleep 200–500 ms between creates if `N >= 5`.
- **Capture and surface partial failures.** A failed create for finding 3 must NOT prevent fixes for findings 1, 2, 4, … Mark in the issue map and continue.
- **Never embed the full evidence body in the natural-language prompt** — only in the structured `description` field. Evidence can contain large network bodies that blow context.
