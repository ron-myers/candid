---
name: candid-chrome-qa
description: Drive a real Chrome session against a running web app to find bugs and write structured findings JSON. Use when the user asks for a QA pass, smoke test, UX audit, accessibility check, or "find bugs / polish / a11y / perf / copy issues" on a route.
---

# Candid Chrome QA

Drive a real Chrome session against a running web app, find issues, and write structured findings to disk for downstream triage. Part of the Candid plugin's QA workflow — sits alongside `/candid-review` (code) and `/candid-ship` (release).

This is a **technique skill**. Follow the order. The schema is non-negotiable.

## Inputs

When invoked, the user provides (or you confirm):
- **goal** — surface to test, e.g. "Agent Config / AI Setup, all 16 tabs". Skipped if `--goal "<text>"` is passed.
- **prompt** — free-form QA plan (what to exercise, edge cases, hot spots). Skipped if `--prompt "<text>"` is passed.
- **app URL** — usually `http://localhost:<port>`. Verify before you start. Skipped if the user passes `--url` or `chromeQA.defaultUrl` is set in `.candid/config.json`.

CLI flags (full set):

| Flag | Purpose |
|---|---|
| `--url <url>` | Provide the app URL up front, skipping the prompt. |
| `--goal "<text>"` | Pre-fill the goal prompt. Skip the interactive ask. |
| `--prompt "<text>"` | Pre-fill the QA-plan prompt. Skip the interactive ask. |
| `--routes "/p1,/p2"` | Comma-separated list of routes to walk. Each becomes one target, bypassing goal-derived target inference. |
| `--severity-floor P3` | Persist only findings at or above this severity (`P0` highest, `P5` lowest). Default `P5` (all). Findings below the floor are still walked and counted toward the `summary` block — they're just not appended to the file. |
| `--viewports "1440x900,390x844"` | Override `chromeQA.desktopViewport` / `chromeQA.mobileViewport` from config. First value = desktop, second = mobile. |
| `--findings-dir <path>` | Override findings output directory (default `.context/findings`). The directory is `mkdir -p`'d on each pass. |
| `--mobile-only` | Explicit opt-out from the desktop pass. Runs **only** the mobile pass. Documented exception to Hard Rule 6. |
| `--desktop-only` | Explicit opt-out from the mobile pass. Runs **only** the desktop pass. Second documented exception to Hard Rule 6. |

`--mobile-only` and `--desktop-only` are mutually exclusive — if both are passed, error out and ask the user which one they meant.

If any required input is missing after flags + config, ask. Don't guess.

## Pre-flight — MANDATORY before any QA work

Run in order. If any step fails, stop and surface to the user — do not invent workarounds.

### 0. Verify Claude in Chrome is available

Run `ToolSearch` with `query: "mcp__claude-in-chrome"`. If it returns zero `mcp__claude-in-chrome__*` tools, stop:

```
Claude in Chrome MCP is not installed in this Claude Code environment.
Install it before running /candid-chrome-qa:
  https://github.com/anthropics/claude-in-chrome
Then restart Claude Code.
```

If it does return tools, batch-load every tool you'll need so subsequent calls don't pay per-tool ToolSearch overhead:

```
ToolSearch query: "select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__resize_window,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests,mcp__claude-in-chrome__javascript_tool"
```

### 1. Load project context

- If `Technical.md` exists in the project root, read it and note any QA-relevant rules: browser support matrix, accessibility target (WCAG A/AA/AAA), API base path, design-system constraints, auth setup. Use these rules during the pass — every Technical.md violation you find should be a finding tagged with `surface: "Technical.md"` and `category` matching the rule's domain.
- If `.candid/config.json` exists, read the optional `chromeQA` block:

  ```json
  {
    "chromeQA": {
      "defaultUrl": "http://localhost:3000",
      "apiPathPattern": "/api/",
      "desktopViewport": "1440x900",
      "mobileViewport": "390x844"
    }
  }
  ```

  All fields optional. Defaults: URL prompted, `apiPathPattern: "/api/"`, viewports as shown.

  **Precedence:** `--viewports` CLI flag > `chromeQA.desktopViewport`/`chromeQA.mobileViewport` config > built-in defaults. `--findings-dir` CLI flag overrides the built-in `.context/findings` path. Record the resolved viewports and output directory in `context.environment` of the findings file so re-runs are reproducible.

### 2. Verify the dev server

`curl -s -o /dev/null -w "%{http_code}" <url>`. Anything other than 2xx/3xx → ask the user to start it. The HTTP code is the source of truth — don't run `lsof` or process probes.

### 3. Get tab context and reuse policy

`mcp__claude-in-chrome__tabs_context_mcp`. Re-use a tab only if the user explicitly says so; otherwise create a fresh tab with `tabs_create_mcp`.

### 4. Resize to desktop default

`resize_window` to the configured `desktopViewport` (default `1440x900`).

### 5. Navigate

`navigate` to the app URL. Wait 2s for the initial render to settle.

### 6. Confirm logged-in state

`read_page interactive` or `javascript_tool` for `({url: location.href, title: document.title})`. If on a login or onboarding route, ask the user explicitly:

```
You're on <url>. Should I:
  (a) Wait while you log in (then continue),
  (b) Switch to a different account / URL, or
  (c) Stop?
```

Do not attempt to log in for them.

### 7. Clear console baseline

`read_console_messages` with `pattern: "."`, `clear: true` — sets the high-water mark so per-target probes only show fresh entries.

### 8. Verify required data

If the goal touches lists/details that need seeded data and the account is empty, **ask the user**: create test data, seed via fixture, switch accounts, or downgrade to source-review. Do not silently switch to source review.

### 9. Open the findings file

1. **Resolve the output directory:** `--findings-dir <path>` if passed, else `.context/findings`. **Make the directory:** `mkdir -p <dir>`.
2. **Generate the slug** from `goal`: lowercase the first 4 words, replace non-alphanumerics with `-`, collapse repeated `-`, trim trailing `-`, truncate to 40 chars. Example: goal `"Agent Config / AI Setup, all 16 tabs"` → `agent-config-ai-setup`.
3. **Choose the filename:** `<dir>/<YYYY-MM-DD>-<slug>.json`. If that file already exists, switch to `<YYYY-MM-DD>-<HHmm>-<slug>.json` (current local time, 24h). Never overwrite a prior pass.
4. **Write the initial schema** with `findings: []`, the `context` block populated, and `summary` omitted (it's added at end-of-pass). Append findings to disk after each one — never batch-write at the end.

## Per-target loop (one route or one tab at a time)

**Target selection:**
- If `--routes "/p1,/p2,/p3"` was passed, the target list is exactly those routes (each one a target). Bypasses goal-derived routing.
- Otherwise, derive targets from `goal` + `prompt` as today (sidebar nav inferred from `read_page interactive` plus user-named surfaces).

For each target, use the **flush-capture cycle** so each step's telemetry is clean:

1. **Navigate / click into target.** Use sidebar buttons rather than direct URL when the app has client-side routing.
2. **Flush telemetry.** `read_network_requests({clear: true})` and `read_console_messages({pattern: ".", clear: true})` — discard prior chatter.
3. **`read_page interactive`** to enumerate elements.
4. **Action.** Exercise 2–3 main interactions (toggle, type, save, cancel) and **1 edge case** (empty input, invalid format, rapid double-click, navigation while dirty).
5. **Wait** 1–2s for in-flight requests to complete.
6. **Capture telemetry.**
   - `read_console_messages({pattern: "error|warn|fail|hydration|nested|aria|deprecat|key"})` — apply console triage table below.
   - `read_network_requests({urlPattern: "<chromeQA.apiPathPattern>"})` (default `/api/`; or `supabase`, or whatever Technical.md / config indicates) — apply network health thresholds below.
   - **Fallback if entries are redacted** (`[BLOCKED: Cookie/query string data]`): run `javascript_tool` with `performance.getEntriesByType('resource').filter(r => r.responseStatus >= 400 || r.responseStatus === 0).map(r => ({url: r.name, status: r.responseStatus, type: r.initiatorType}))` to recover full URLs from inside the page.
7. **Append findings.** Each finding written to disk immediately, not buffered. **Severity floor:** if `--severity-floor <P>` was passed (default `P5` = all), drop findings whose severity is **below** the floor at this step. Severity order, highest first: `P0` > `P1` > `P2` > `P3` > `P4` > `P5`. Findings dropped at this step are still counted in the end-of-pass `summary` block — they just don't land in the `findings` array. This keeps the summary honest about what was walked.
8. **Reset state** if you mutated something that affects subsequent targets (escape dirty-form modals via Discard, etc.).

If a target produces no findings, append a single `confidence: "definite"`, `severity: "P5"`, `title: "✓ no issues — probes ran clean"` finding so coverage is provable.

### Console triage table

| Console output | Severity |
|---|---|
| Uncaught TypeError / ReferenceError | **P0** |
| Unhandled Promise rejection | **P0** |
| React: "Cannot update a component while rendering a different component" | **P1** |
| React: "Each child in a list should have a unique 'key' prop" (if data-dependent) | **P1** |
| Hydration mismatch (`<button>` inside `<button>`, etc.) | **P2** |
| CORS policy errors | **P1** |
| Any `Error:` in red not in the ignorable list | **P1** |
| `componentWillMount`/`findDOMNode` deprecation | **P2** |
| "Can't perform a React state update on an unmounted component" | **P2** |
| Large-payload performance warnings | **P3** |
| **Ignorable:** "Download the React DevTools", `/favicon.ico` 404, source map warnings, Clerk dev-mode warning, third-party analytics errors | skip |

### Network health thresholds

| Metric | Good | Concerning | Bad |
|---|---|---|---|
| Error rate (4xx/5xx) | < 1% | 1–5% | > 5% |
| Avg response time | < 200 ms | 200 ms – 1 s | > 1 s |
| Payload per request | < 100 KB | 100 KB – 1 MB | > 1 MB |
| Duplicate requests within 200 ms | 0 | 1–2 | 3+ identical |

Anything in **Bad** → P0/P1. **Concerning** → P2/P3.

### Edge-case bug patterns to probe

When picking your "1 edge case" per target, reach for one of these — they catch the majority of production-only failures:

- **Race condition** — fire 3+ identical requests within 500 ms (rapid double-click save). Look for mixed 200/500 on the same endpoint.
- **Stale state** — mutate → navigate away → come back. Does it show the new data? Missing re-fetch after mutation = stale state.
- **Silent failure** — perform action that returns 200, then refresh and verify the change actually persisted. Optimistic UI lies.
- **Memory drift** — repeat an action 20× and snapshot `document.querySelectorAll('*').length` early vs late. Significant growth = leak.
- **Idle WebSocket** — for real-time features, idle 60s and check console for close events without reconnect. **Skip on multi-target passes** (>5 targets) unless the user explicitly asks — a 60s idle per target adds up fast.

## Cross-cutting probes — run once per pass

Use `javascript_tool` to probe the DOM systematically. These catch things click-by-click won't.

```js
// A11y probe — count and enumerate
({
  iconButtonsNoLabel: Array.from(document.querySelectorAll('button')).filter(b =>
    !b.innerText.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby')).length,
  imagesNoAlt: Array.from(document.querySelectorAll('img')).filter(i => !i.alt && i.getAttribute('aria-hidden') !== 'true').length,
  inputsNoLabel: Array.from(document.querySelectorAll('input, textarea, select')).filter(i => {
    if (i.type === 'hidden') return false;
    if (i.getAttribute('aria-label') || i.getAttribute('aria-labelledby')) return false;
    if (i.id && document.querySelector('label[for="'+i.id+'"]')) return false;
    return !i.closest('label');
  }).length
})
```

```js
// Touch-target probe (mobile only)
Array.from(document.querySelectorAll('button, a, [role="button"]'))
  .map(el => ({label: (el.innerText||el.getAttribute('aria-label')||'').slice(0,40), w: el.offsetWidth, h: el.offsetHeight}))
  .filter(x => x.w > 0 && (x.w < 44 || x.h < 44))
  .slice(0,15)
```

## Mobile pass — required by default

After desktop pass:
1. `resize_window` to the configured `mobileViewport` (default `390x844`).
2. Re-walk the 5 most-used targets (or user-specified subset).
3. Run the touch-target probe above.
4. Note layout overflow, hidden CTAs, modal dismissal, keyboard behaviour for inputs, fixed-position elements that overlap content.

**Resize ceiling fallback:** Chrome may enforce a minimum content width of ~1075 px on the active tab depending on UI chrome. If `resize_window` to 390 wide doesn't take effect, try the smallest you can reach (often ~500 px) — the mobile breakpoint still triggers, the desktop sidebar still hides, and the hamburger drawer still appears. Note the actual width reached in the finding's `evidence`.

**`--mobile-only` flag** inverts the default: skip the desktop pass entirely and run only the mobile sequence above. This is an **explicit opt-out** of Hard Rule 6 (which forbids running mobile without desktop). Use sparingly — most QA passes need both.

**`--desktop-only` flag** skips the mobile pass entirely. Use when the surface is admin-only, internal tooling, or otherwise has no mobile contract to honor. Like `--mobile-only`, it's an explicit opt-out — without the flag, mobile is required.

**`--mobile-only` + `--desktop-only` are mutually exclusive.** If both are passed, error and ask the user which one they meant. Don't silently pick one.

## Hot-spot stress — when the user provides recent commits or known weak points

For each: drive the recently-changed surface harder. Resize to 700px tall to stress sidebar/scroll fixes; switch orgs mid-edit to stress org-scope; trigger validation; double-click save.

## Output schema (v2.0) — exact, do not modify

Every finding file looks like this. Producers write the `schemaVersion`, `context`, `findings`, and (at end of pass) `summary` blocks. Consumers should target `schemaVersion: "2.0"`.

```json
{
  "schemaVersion": "2.0",
  "context": {
    "createdAt": "2026-04-25T18:30:00Z",
    "scope": "Agent Config / AI Setup, all 16 tabs",
    "originatingPrompt": "Walk every tab; exercise save/cancel; hammer phone provisioning",
    "environment": {
      "url": "http://localhost:3000",
      "branch": "feature/agent-config-v2",
      "commit": "8001a89",
      "viewport": "1440x900",
      "agentModel": "claude-opus-4-7"
    }
  },
  "findings": [
    {
      "id": "F-a3f29b71",
      "severity": "P0",
      "category": "bug",
      "surface": "dashboard/agents/[id]/voice",
      "viewport": "both",
      "url": "http://localhost:3000/dashboard/agents/agent_123/voice",
      "title": "Save button does nothing on Voice tab when phone is unprovisioned",
      "repro": "1. Open agent\n2. Voice tab\n3. Click Save",
      "expected": "Either save or show validation error",
      "actual": "Click registers, no network call, no error, no state change",
      "evidence": {
        "consoleErrors": [
          {"level": "warn", "message": "[react-hook-form] missing required: phoneNumber"}
        ],
        "networkRequests": [
          {"method": "POST", "url": "/api/agents/agent_123", "status": 0, "durationMs": 0}
        ],
        "filesLikelyTouched": ["app/src/components/agent/VoiceTab.tsx:142"]
      },
      "suggestedFix": "Surface the form validation error in the UI; current handler swallows it",
      "groupHint": "form-state",
      "confidence": "definite",
      "capturedAt": "2026-04-25T18:34:12Z"
    }
  ],
  "summary": {
    "total": 19,
    "bySeverity": {"p0": 2, "p1": 5, "p2": 8, "p3": 2, "p4": 1, "p5": 1},
    "byCategory": {"bug": 8, "a11y": 4, "perf": 2, "ux": 3, "copy": 1, "security": 0, "compat": 1}
  }
}
```

### Required per-finding fields

`id`, `severity`, `category`, `surface`, `viewport`, `url`, `title`, `repro`, `expected`, `actual`, `suggestedFix`, `groupHint`, `confidence`, `capturedAt`. `evidence` is optional but include any non-obvious signal you captured.

### Enum values (use exactly these strings)

- **`severity`**: `"P0"`, `"P1"`, `"P2"`, `"P3"`, `"P4"`, `"P5"`
- **`category`**: `"bug"`, `"a11y"`, `"perf"`, `"ux"`, `"copy"`, `"security"`, `"compat"`
- **`viewport`**: `"desktop"`, `"mobile"`, `"both"`
- **`confidence`**: `"definite"`, `"likely"`, `"suspected"` (default `"definite"` if uncertain)
- **`evidence.consoleErrors[].level`**: `"error"`, `"warn"`, `"info"`

### ID generation (deterministic — enables dedup across passes)

`id` is `F-` + the first 8 hex chars of the SHA-1 of `<url>|<title>`. Example: `F-a3f29b71`. Use `javascript_tool` to compute it inside the page if needed:

```js
crypto.subtle.digest('SHA-1', new TextEncoder().encode(`${url}|${title}`))
  .then(buf => 'F-' + Array.from(new Uint8Array(buf)).slice(0,4).map(b => b.toString(16).padStart(2,'0')).join(''))
```

Same finding (same URL + same title) in a re-run gets the same ID — downstream tools can dedup.

### Severity scale

Maps to Linear priority:

| Severity | Meaning | Linear |
|----------|---------|--------|
| **P0** | feature broken, blocks user | Urgent |
| **P1** | clear bug or a11y violation | High |
| **P2** | UX polish | Medium |
| **P3** | perf concern | Medium |
| **P4** | copy / wording | Low |
| **P5** | enhancement idea | No priority |

`groupHint` is a short slug shared across related findings — used by downstream tools to bundle into one workspace. Examples: `form-state`, `phone-provisioning`, `analytics-defaults`, `mobile-layout`. If a finding is unique, use a unique slug.

**Schema migration note:** This is v2.0. Downstream consumers must target `schemaVersion: "2.0"`. v1 fields (`body`, `status`, `tag`, stringified `consoleErrors`/`networkRequests`) are dropped — consumers expecting them will break. The `body` field (rendered markdown view) is gone — render from the structured fields at read time. The `status` field is gone — finding lifecycle is the consumer's concern.

## Final summary — required at end of pass

After the last finding is appended, **before** reporting back to the user, do all of the following atomically (do not declare done until every step lands):

1. **Compute counts** from the file's `findings` array.
2. **Write the `summary` block** to the JSON file. Preserve top-level key order: `schemaVersion`, `context`, `findings`, `summary`.
3. **Mentally `JSON.parse`** the file: scan for trailing commas, unquoted keys, unbalanced braces, missing required per-finding fields.
4. **Print to stdout** in this **exact** format. Always print all 6 severity rows and all 7 category rows (`0` is meaningful — it documents what was looked for).

```
Chrome QA pass: <scope>
Total findings: <N>

Severity:
  P0 (urgent):   <n>
  P1 (high):     <n>
  P2 (medium):   <n>
  P3 (perf):     <n>
  P4 (copy):     <n>
  P5 (idea):     <n>

Category:
  bug:      <n>
  a11y:     <n>
  perf:     <n>
  ux:       <n>
  copy:     <n>
  security: <n>
  compat:   <n>

Top issues (P0 + P1):
  • [P0] <title> — <url>
  • [P1] <title> — <url>
  ...

Findings file: .context/findings/<filename>.json
```

If there are zero P0 and zero P1 findings, replace the "Top issues" block with `Top issues: none — no P0/P1`. If the entire pass has zero findings (every target appended a `✓ no issues` entry), still print the format above with all rows showing `0`, then add a final line: `Result: clean pass.`

The JSON file is always the source of truth — stdout is a courtesy for users who don't run a triage tool.

## Hard rules — do not violate

1. **Never click destructive actions** without explicit user approval each time: delete agent/account, disconnect Twilio/integrations, drop data, irreversible API operations, "force send", "publish", "purchase".
2. **Never silently downgrade** from live QA to source-only review. If data is missing, ask.
3. **Never invent the schema.** Use the v2.0 schema above byte-for-byte. Downstream consumers depend on it.
4. **Never batch-write findings at the end.** Append per-finding. Context can exhaust mid-pass.
5. **Never claim "no issues" without running the cross-cutting probes.** A `✓ no issues — probes ran clean` finding is fine; skipping the probes is not.
6. **Never resize to mobile without first finishing desktop.** Mobile is additive, not a substitute. **Exceptions:** `--mobile-only` skips the desktop pass entirely; `--desktop-only` skips the mobile pass entirely. Both are explicit opt-outs — without one, run both. Passing both flags is an error — ask the user which they meant.
7. **Never use a stale tab.** Always `tabs_context_mcp` first. If reusing a tab, confirm with the user.
8. **Never proceed without verifying Claude in Chrome is loaded** (Pre-flight step 0). Without it, every subsequent tool call fails opaquely.

## Stop conditions

Finished when **all** of:
- Every target in `goal` has at least one finding entry (real finding OR `✓ no issues — probes ran clean`).
- Hot-spot tests requested by the user each have explicit ✓ or finding.
- Mobile pass covers the agreed subset (or `--mobile-only` was passed and you ran only mobile).
- Cross-cutting probes ran on at least one representative page.
- File on disk validates: mentally simulate `JSON.parse`. Reject if you spot trailing commas, unquoted keys, unbalanced braces, or any per-finding missing a required field.
- `summary` block populated at end of pass.
- Stdout summary printed.

If you hit a hard blocker (server down mid-pass, dirty-state trap, unrecoverable error), stop and surface — do not work around it silently.

## Common rationalizations — STOP if you catch yourself

| Excuse | Reality |
|--------|---------|
| "I'll write the schema my way, it's clearer" | Downstream consumers target `schemaVersion: "2.0"` — your custom fields get dropped, and missing v2-required fields break triage. |
| "Source review is fine since data is missing" | Silent downgrade. Ask first. |
| "I'll batch findings at the end for cleanliness" | Context exhausts. Findings lost. Append per-finding. |
| "Mobile is similar to desktop, skip it" | Found mobile-only bugs ~30% of pass. Don't skip unless `--mobile-only` was passed. |
| "Console looks clean, skip the probe" | Probes catch DOM-level a11y issues clicks miss. Run them. |
| "Click-tested ~all interactions, no need for edge cases" | Edge cases (empty/invalid/rapid-double-click) are where the bugs live. Run at least one per target. |
| "User said skip the pre-flight" | They didn't. Ask before skipping. |
| "I'll add `body` back, it's cleaner for humans" | v2 dropped `body` deliberately — pure derivation. Render at consumption time. |
| "I'll skip the stdout summary, the JSON has the data" | The summary is the pass's headline. Users without a triage tool need it. |
| "I'll use `'P0\|P1\|P2'` as the severity since the schema example showed it" | The schema example shows real values like `"P0"`. Pipe-delimited strings are TypeScript-style enum docs, not JSON values. Use one exact string. |
| "I don't need `mkdir -p` — the directory probably exists" | It probably doesn't. Make it explicitly. |
| "User passed `--severity-floor P0` so I'll skip walking the lower-severity stuff" | Wrong layer. Walk everything; drop only at the persist step (#7). The `summary` block must reflect the full walk, otherwise `Top issues: none` becomes a lie when there were P3s you skipped. |
| "I'll silently override `--viewports` if the second value won't fit" | Use the resize-ceiling fallback (mobile-pass section) and record the actual width reached in the finding's `evidence`. Never silently change user-provided viewports. |
| "User passed `--routes` so I'll skip the cross-cutting probes" | Cross-cutting probes still run once per pass. `--routes` narrows the per-target loop, not the probes. |

## Red flags — STOP and re-read this skill

- About to write findings without `repro/expected/actual` structure
- About to skip the desktop pass without `--mobile-only` having been passed
- About to invent a new top-level field in the JSON
- About to click "Delete" / "Disconnect" / "Force" without asking
- About to silently use a stale tab from a prior session
- About to skip the final summary (JSON `summary` block + stdout block)
- About to call `mcp__claude-in-chrome__*` without having run Pre-flight step 0
- About to write `"P0|P1|P2|P3|P4|P5"` as the value of a `severity` field

All of these mean: stop, re-read the relevant section, follow the protocol.
