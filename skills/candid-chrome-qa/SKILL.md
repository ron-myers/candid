---
name: candid-chrome-qa
description: Drive a real Chrome session against a running web app, find bugs, and emit structured findings JSON. Use when the user asks for a QA pass, smoke test, UX audit, accessibility check, or "find bugs / polish / a11y / perf / copy issues on <route>". Walks the target like a real user across desktop and mobile via mcp__claude-in-chrome__*, runs DOM/console/network probes, and writes findings to .context/findings/<date>-<slug>.json against the v2 schema in this skill.
---

# Candid Chrome QA

Drive a real Chrome session against a running web app, find issues, and write structured findings to disk for downstream triage. Part of the Candid plugin's QA workflow — sits alongside `/candid-review` (code) and `/candid-ship` (release).

This is a **technique skill**. Follow the order. The schema is non-negotiable.

## Inputs

When invoked, the user provides (or you confirm):
- **goal** — surface to test, e.g. "Agent Config / AI Setup, all 16 tabs"
- **prompt** — free-form QA plan (what to exercise, edge cases, hot spots)
- **app URL** — usually `http://localhost:<port>`. Verify before you start.

If any input is missing, ask. Don't guess.

## Pre-flight — MANDATORY before any QA work

Run in order. If any step fails, stop and surface to the user — do not invent workarounds.

1. **Verify the dev server.** `curl -s -o /dev/null -w "%{http_code}" <url>`. Anything other than 2xx/3xx → ask the user to start it. Don't assume the port — `lsof -ti:<port>` to confirm a process is listening.
2. **Get tab context.** `mcp__claude-in-chrome__tabs_context_mcp` (load via ToolSearch first if not already loaded). Re-use a tab only if the user explicitly says so; otherwise create a fresh tab with `tabs_create_mcp`.
3. **Resize to desktop default.** `resize_window` to 1440x900 unless the user specifies.
4. **Navigate.** `navigate` to the app URL. Wait 2s.
5. **Confirm logged-in state.** `read_page interactive` or `javascript_exec` for `({url: location.href, title: document.title})`. If on a login or onboarding route, ask the user before proceeding.
6. **Clear console baseline.** `read_console_messages` with `pattern: "."`, `clear: true` — sets the high-water mark so per-target probes only show fresh entries.
7. **Verify required data.** If the goal touches lists/details that need seeded data and the account is empty, **ask the user**: create test data, seed via fixture, switch accounts, or downgrade to source-review. Do not silently switch to source review.
8. **Open the findings file.** Create `.context/findings/<YYYY-MM-DD>-<slug>.json` with the schema below, empty `findings: []`, and the `context` block populated. Append to it after each finding — never batch-write at the end. If a same-day file with the same slug already exists, suffix `-<HHmm>` to avoid clobbering a prior pass.

## Per-target loop (one route or one tab at a time)

For each target identified in `goal` + `prompt`, use the **flush-capture cycle** so each step's telemetry is clean:

1. **Navigate / click into target.** Use sidebar buttons rather than direct URL when the app has client-side routing.
2. **Flush telemetry.** `read_network_requests({clear: true})` and `read_console_messages({pattern: ".", clear: true})` — discard prior chatter.
3. **`read_page interactive`** to enumerate elements.
4. **Action.** Exercise 2–3 main interactions (toggle, type, save, cancel) and **1 edge case** (empty input, invalid format, rapid double-click, navigation while dirty).
5. **Wait** 1–2s for in-flight requests to complete.
6. **Capture telemetry.**
   - `read_console_messages({pattern: "error|warn|fail|hydration|nested|aria|deprecat|key"})` — apply console triage table below.
   - `read_network_requests({urlPattern: "/api/"})` (or `supabase`, or the relevant domain) — apply network health thresholds below.
   - **Fallback if entries are redacted** (`[BLOCKED: Cookie/query string data]`): run `javascript_exec` with `performance.getEntriesByType('resource').filter(r => r.responseStatus >= 400 || r.responseStatus === 0).map(r => ({url: r.name, status: r.responseStatus, type: r.initiatorType}))` to recover full URLs from inside the page.
7. **Append findings.** Each finding written to disk immediately, not buffered.
8. **Reset state** if you mutated something that affects subsequent targets (escape dirty-form modals via Discard, etc.).

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
- **Idle WebSocket** — for real-time features, idle 60s and check console for close events without reconnect.

## Cross-cutting probes — run once per pass

Use `javascript_exec` to probe the DOM systematically. These catch things click-by-click won't.

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

## Mobile pass — required, not optional

After desktop pass:
1. `resize_window` to 390x844.
2. Re-walk the 5 most-used targets (or user-specified subset).
3. Run the touch-target probe above.
4. Note layout overflow, hidden CTAs, modal dismissal, keyboard behaviour for inputs, fixed-position elements that overlap content.

**Resize ceiling fallback:** Chrome may enforce a minimum content width of ~1075 px on the active tab depending on UI chrome. If `resize_window` to 390 wide doesn't take effect, try the smallest you can reach (often ~500 px) — the mobile breakpoint still triggers, the desktop sidebar still hides, and the hamburger drawer still appears. Note the actual width reached in the finding's `evidence`.

## Hot-spot stress — when the user provides recent commits or known weak points

For each: drive the recently-changed surface harder. Resize to 700px tall to stress sidebar/scroll fixes; switch orgs mid-edit to stress org-scope; trigger validation; double-click save.

## Output schema (v2.0) — exact, do not modify

Every finding file looks like this. Producers write the `schemaVersion`, `context`, `findings`, and (at end of pass) `summary` blocks. Consumers should target `schemaVersion: "2.0"`.

```json
{
  "schemaVersion": "2.0",
  "context": {
    "createdAt": "<ISO8601>",
    "scope": "<goal verbatim>",
    "originatingPrompt": "<prompt verbatim>",
    "environment": {
      "url": "http://localhost:3000",
      "branch": "<git branch>",
      "commit": "<short sha>",
      "viewport": "1440x900",
      "agentModel": "<your model id>"
    }
  },
  "findings": [
    {
      "id": "F-<8charSlug>",
      "severity": "P0|P1|P2|P3|P4|P5",
      "category": "bug|a11y|perf|ux|copy|security|compat",
      "surface": "<route or component, e.g. 'dashboard/calls' or 'AgentConfigForm'>",
      "viewport": "desktop|mobile|both",
      "url": "<full URL where reproduced, including query/hash>",
      "title": "<one line, <80 chars>",
      "repro": "1. step\n2. step\n3. step",
      "expected": "<one line>",
      "actual": "<one line>",
      "evidence": {
        "consoleErrors": [
          {"level": "error|warn|info", "message": "..."}
        ],
        "networkRequests": [
          {"method": "GET", "url": "/api/x", "status": 400, "durationMs": 1234}
        ],
        "filesLikelyTouched": ["app/src/.../Foo.tsx:120"]
      },
      "suggestedFix": "<one line>",
      "groupHint": "<topic-slug, e.g. 'form-state' or 'phone-provisioning'>",
      "confidence": "definite|likely|suspected",
      "capturedAt": "<ISO8601>"
    }
  ],
  "summary": {
    "total": 0,
    "bySeverity": {"p0": 0, "p1": 0, "p2": 0, "p3": 0, "p4": 0, "p5": 0},
    "byCategory": {"bug": 0, "a11y": 0, "perf": 0, "ux": 0, "copy": 0, "security": 0, "compat": 0}
  }
}
```

**Required per-finding fields:** `id`, `severity`, `category`, `surface`, `viewport`, `url`, `title`, `repro`, `expected`, `actual`, `suggestedFix`, `groupHint`, `confidence`, `capturedAt`. `evidence` is optional but include any non-obvious signal you captured.

**Severity scale (maps to Linear priority):**
- **P0** — feature broken, blocks user (Linear: Urgent)
- **P1** — clear bug or a11y violation (Linear: High)
- **P2** — UX polish (Linear: Medium)
- **P3** — perf concern (Linear: Medium)
- **P4** — copy / wording (Linear: Low)
- **P5** — enhancement idea (Linear: No priority)

**Category** (separate from severity — describes *type* of issue, for routing):
- **bug** — functional defect, broken behaviour
- **a11y** — accessibility violation (missing label, contrast, focus order, ARIA)
- **perf** — performance issue (slow request, large payload, jank)
- **ux** — interaction polish (confusing flow, unexpected modal, form quirk)
- **copy** — wording, grammar, microcopy
- **security** — exposed data, missing auth check, XSS shape
- **compat** — browser/viewport/OS-specific issue

**Viewport** records where the bug was observed: `desktop` (1440x900 default), `mobile` (390x844), or `both` (reproduces in either).

**Confidence** lets triage prioritise: `definite` (saw it; reproducible), `likely` (saw it; haven't re-verified), `suspected` (signal in console/network but couldn't isolate the trigger). Default `definite`.

**`groupHint`** is a short slug shared across related findings — used by downstream tools to bundle into one workspace. Examples: `form-state`, `phone-provisioning`, `analytics-defaults`, `mobile-layout`. If a finding is unique, use a unique slug.

**Schema migration note:** This is v2.0. v1 consumers expecting `body`, `status`, `tag`, or stringified `consoleErrors`/`networkRequests` arrays will need migration. The `body` field (rendered markdown view) was dropped — consumers should render from the structured fields at read time. The `status` field was dropped — finding lifecycle is the consumer's concern, not the producer's.

## Final summary — required at end of pass

After the last finding is appended, **before** reporting back to the user:

1. **Compute counts** from the file's `findings` array.
2. **Write the `summary` block** to the JSON file (preserve top-level key order: `schemaVersion`, `context`, `findings`, `summary`).
3. **Print to stdout** in this format:

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

If no findings (clean pass), print:

```
Chrome QA pass: <scope>
✓ No issues found across <N> targets. Probes ran clean.
Findings file: .context/findings/<filename>.json
```

Suppress empty severity/category rows. The JSON file is always the source of truth — stdout is a courtesy for users who don't run a triage tool.

## Hard rules — do not violate

1. **Never click destructive actions** without explicit user approval each time: delete agent/account, disconnect Twilio/integrations, drop data, irreversible API operations, "force send", "publish", "purchase".
2. **Never silently downgrade** from live QA to source-only review. If data is missing, ask.
3. **Never invent the schema.** Use the v2.0 schema above byte-for-byte. Downstream consumers depend on it.
4. **Never batch-write findings at the end.** Append per-finding. Context can exhaust mid-pass.
5. **Never claim "no issues" without running the cross-cutting probes.** A finding of "ran probes, all green" is fine; skipping the probes is not.
6. **Never resize to mobile without first finishing desktop.** Mobile is additive, not a substitute.
7. **Never use a stale tab.** Always `tabs_context_mcp` first. If reusing a tab, confirm with the user.

## Stop conditions

Finished when **all** of:
- Every target in `goal` has at least one finding line OR an explicit "✓ no issues — probes ran clean" entry.
- Hot-spot tests requested by the user each have explicit ✓ or finding.
- Mobile pass covers the agreed subset.
- Cross-cutting probes ran on at least one representative page.
- File on disk validates against the v2 schema (parses cleanly, no trailing commas, all required per-finding fields present).
- `summary` block populated at end of pass.
- Stdout summary printed.

If you hit a hard blocker (server down mid-pass, dirty-state trap, unrecoverable error), stop and surface — do not work around it silently.

## Common rationalizations — STOP if you catch yourself

| Excuse | Reality |
|--------|---------|
| "I'll write the schema my way, it's clearer" | Triage tool only reads the canonical fields. Your fields get dropped. |
| "Source review is fine since data is missing" | Silent downgrade. Ask first. |
| "I'll batch findings at the end for cleanliness" | Context exhausts. Findings lost. Append per-finding. |
| "Mobile is similar to desktop, skip it" | Found mobile-only bugs ~30% of pass. Don't skip. |
| "Console looks clean, skip the probe" | Probes catch DOM-level a11y issues clicks miss. Run them. |
| "Click-tested ~all interactions, no need for edge cases" | Edge cases (empty/invalid/rapid-double-click) are where the bugs live. Run at least one per target. |
| "User said skip the pre-flight" | They didn't. Ask before skipping. |
| "I'll add `body` back, it's cleaner for humans" | v2 dropped `body` deliberately — pure derivation. Render at consumption time. |
| "I'll skip the stdout summary, the JSON has the data" | The summary is the pass's headline. Users who don't run a triage tool need it. |

## Red flags — STOP and re-read this skill

- About to write findings without `repro/expected/actual` structure
- About to skip mobile pass to "save time"
- About to invent a new top-level field in the JSON
- About to click "Delete" / "Disconnect" / "Force" without asking
- About to silently use a stale tab from a prior session
- About to skip the final summary (JSON `summary` block + stdout block)

All of these mean: stop, re-read the relevant section, follow the protocol.
