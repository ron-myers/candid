# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.22.0] - 2026-07-07

### Added

- **`/candid-improve`** — a new skill that refines a **generic output** (marketing copy, docs, an answer, a plan, a prompt, any text) against your goal, distinct from the code-only `candid-review` and `candid-improve-implementation`:
  - **Critique → refine loop**: each cycle names weaknesses across five lenses (🎯 Intent fit, 🧩 Completeness, 🔍 Clarity, ✂️ Concision, 🎨 Craft), then rewrites to address them with a before→after preview
  - **Fully generic input**: improves whatever you point at — `--file <path>`, pasted text, or (default) the most recent substantive output in the session
  - **Configurable stop conditions**: single pass by default; opt into `--iterations N`, `--until-converged`, or a `--criteria "..."` rubric, all capped by `--max-iterations` (default 5)
  - **Modes mirroring candid-loop**: `auto` / `review-each` / `interactive` via `--mode` or `improveOutput.mode`
  - **Source-aware destination**: file sources default to writing back (`--in-place`/`--out`, overwrite confirmed first); inline/session sources print to chat
  - **Loop invariants**: convergence requires a fresh pass, no-progress and oscillation halt the loop
  - New `skills/candid-improve/{SKILL.md,CONFIG.md}`, `commands/candid-improve.md`, docs page, and full site wiring (core-features nav, slash-commands reference, homepage command list, Codex command mapping)
  - Config namespace `improveOutput` and state file `.candid/last-improve-output.json` — deliberately separate from `candid-improve-implementation`'s `improve` block

## [1.21.0] - 2026-07-04

### Added

- **Fix selection, clearer and safer** (candid-review, candid-improve-implementation, candid-loop):
  - **Triage Queue**: reviews open with a ranked table — #, severity, file, title, fix confidence, estimated fix scope — and the `#N` ids stay canonical through selection prompts, todos, the status report, and the commit message
  - **"Show me the exact diff"**: any fix can be previewed as a unified diff built from real file content before saying yes (all three selection UIs); a preview never counts as approval
  - **Confidence-tier bulk apply**: "Apply a subset" now offers Critical+Major, Safe ✓ only (mechanical, no behavior change), or the intersection
  - **Selection receipt + per-fix status**: one-screen receipt (applying/skipped/recorded) before apply, and a per-fix ✅ applied / ❌ failed table after; one failure never aborts the batch; edits apply bottom-up per file so anchors don't shift
  - **`--triage` mode**: review + queue + saved state, nothing applied — for CI and quick checks (CLI-only by design)
- **Ship confidence** (candid-ship, candid-fast-ship):
  - **Ship Confidence Report**: evidence panel (review/build/tests/QA findings/untested changes/diff risk) with a HIGH/MEDIUM/LOW verdict, printed pre-PR and embedded in the PR body; skipped signals render as SKIPPED — absence of evidence is visible, never hidden; LOW verdict requires explicit confirmation
  - **Diff risk classification**: migrations/auth/API contracts/dependencies/config classify the diff HIGH risk — blocking `--skip-review`/`--skip-tests` on candid-ship and routing fast-ship to the full pipeline
  - **QA Findings Gate**: open P0/P1 chrome-qa findings newer than the merge-base that overlap the diff must be acknowledged or the ship aborts; acknowledgments are recorded in the PR body
  - **Test-to-change mapping**: changed source files with no test change and no covering test file are reported as untested changes (a hard prompt when risk is HIGH)
  - **Rollback note**: every PR body ends with the exact revert command plus risk-derived caveats (migrations, config, dependencies, auth)

## [1.20.0] - 2026-07-04

### Changed

- **Effectiveness pass — 10 improvements to raise catch-rate and cut false positives** (+88 lines across 8 files):
  - `candid-review`: new Hard Rules (read the enclosing function and grep callers before flagging; every issue needs quoted evidence + a concrete trigger); untracked files now reviewed, rename detection (`-M`), staged/unstaged-mix warning; severity boundary test (🔥 Critical requires a nameable trigger); auto-select contradiction with candid-loop resolved (loop `--mode auto` counts as explicit selection)
  - `candid-loop`: new Loop Invariants — PASS requires a fresh post-fix review, zero-progress iterations exit INCOMPLETE, oscillation (a fixed issue reappearing) halts the loop, rejected issues aren't re-asked
  - `agents/code-reviewer`: receives diff hunks, must verify reachability before flagging, and returns a verbatim `evidence` quote per issue
  - `candid-init`: generated rules carry provenance tags — `[observed N/M]` with known exceptions vs `[recommended]`; analysis agents must report adherence counts and negative evidence (patterns the codebase deliberately avoids)
  - `candid-validate-standards`: new 4.6 Codebase Spot-Check — samples real files per rule and flags stale/untrue/contested rules
  - `candid-chrome-qa-fix`: mandatory in-browser re-verification of each finding's repro steps before a fix may be marked ✓; new `⚠ applied-unverified` and `✗ still-reproduces` outcomes
  - `candid-ship`: test step must report actual test counts + exit code; exit 0 with zero tests executed is a failure, not a pass

## [1.19.1] - 2026-07-04

### Changed

- **Token-efficiency pass across all 10 skills** (~1,770 lines removed from always-loaded context, zero behavior change):
  - **Progressive disclosure**: `candid-init`'s 10 agent-prompt templates moved verbatim to `skills/candid-init/reference/` (loaded only in thorough mode); `candid-review`'s 75-line edge-case checklist moved to `skills/candid-review/EDGE-CASE.md` (loaded only with `--focus edge-case`)
  - **Config example galleries trimmed**: `candid-review/CONFIG.md` and `candid-improve-implementation/CONFIG.md` reduced from ~18 examples each to the 2–4 that add information beyond the schema
  - **Boilerplate dedupe**: the CLI → project config → user config → default precedence ladder now stated once per skill instead of once per field; duplicate `--auto-commit` spec, repeated summary/banner templates, and identity mappings removed
  - **Command files now delegate**: `commands/*.md` recaps of workflow/output/config deleted — they double-loaded with SKILL.md on every invocation
  - **Shared templates**: ship/fast-ship plan boxes unified in `candid-ship/WORKFLOW.md`; chrome-qa-fix's three identical unsupported-provider warnings merged into one
  - All review criteria, severity/category definitions, checklists, output strings, and defaults preserved verbatim

## [1.19.0] - 2026-05-12

### Added

- **Codex CLI support** ([#73](https://github.com/ron-myers/candid/issues/73)): Candid now installs and runs on the OpenAI Codex CLI alongside Claude Code from the same repo. Skills are the single source of truth — both hosts share `skills/`, no fork, no duplication.
  - New `.codex-plugin/plugin.json` Codex plugin manifest mirroring `.claude-plugin/plugin.json`
  - New `.agents/plugins/marketplace.json` Codex marketplace manifest
  - New `docs/codex/install.md` with install instructions and a full command-to-skill mapping (`/candid-review --harsh` → `$candid-review --harsh`, etc.)
  - `scripts/bump-version.ts` updates all four manifests in lockstep so Claude and Codex versions never drift
  - New `scripts/validate-manifests.ts` (`npm run validate-manifests`) enforces version lockstep + required-key shape across all four manifest files
  - Codex has no `/commands/` first-class concept — users invoke skills via `$skill-name` mention syntax or the `/skills` browser; arg flags (`--harsh`, `--focus security`, etc.) are identical across hosts because the skill body parses them
  - Subagent dispatch (`agents/code-reviewer.md`) remains a Claude Code optimization for now; Codex runs the review inline (single-threaded). Configure `[agents.code-reviewer]` in your Codex `config.toml` if you want parallel review threads on large diffs.

## [1.18.0] - 2026-04-30

### Added

- **Candid Improve Implementation** (`/candid-improve-implementation`): A new skill that runs an improvement-lens pass on the current implementation — distinct from `candid-review`'s defect hunt. Where `/candid-review` asks *"what's wrong or risky?"*, this skill asks *"the code works — what would the next version look like if we built it again with what we know now?"*
  - **Three signal categories** with explicit checklists: 🧭 **Approach** (existing util/pattern reuse, simpler decomposition, premature/missing abstractions, data-shape changes), 🔍 **Clarity** (misleading names, control flow hiding intent, mixed abstraction levels, comments that should be code or deleted), ✨ **Quality** (idiomatic fit, dead code, leftover scaffolding, testability friction, cheap perf wins that don't trade clarity)
  - **Optional 🐛 Bugs section** — if the reviewer happens to spot real defects while scanning, they're surfaced as one-liners with a pointer to `/candid-review`. Capped at 3. Suppress entirely with `--no-bugs`
  - **Quality over quantity**: ranks all candidates and caps the final list at 7 high-signal opportunities (configurable via `improve.maxOpportunities`). Drops low-impact suggestions even if technically valid — a 4-item review the user actually applies beats a 12-item review the user skims
  - **Per-opportunity structured format**: `Current` snippet, `Suggested` before/after, `Why it's better` (specific property gained), `Tradeoff` (what's given up, or "None — strictly better"), and `Confidence` level (Safe ✓ / Verify ⚡ / Careful ⚠️)
  - **Scope ladder**: unstaged changes first; if none, branch diff vs configured merge target. Skips the staged-only check that `candid-review` starts with — improvement passes target work-in-progress or branch-level deltas, not commits about to be made
  - **Three-phase fix selection** (mirrors `candid-review` Step 8): bulk action choice (apply all / apply Safe ✓ only / review individually / track as todos) → optional per-item review → confirmation summary. Mandatory step — never auto-applies without explicit user confirmation
  - **Tone preference** mirrors `candid-review`'s harsh/constructive split with the same precedence loader (CLI flag → project config → user config → interactive prompt)
  - **Flags**: `--harsh` / `--constructive` (tone), `--focus approach|clarity|quality` (single-category mode), `--exclude <pattern>` (skip files), `--no-bugs` (suppress bugs section), `--auto-commit` (commit applied suggestions)
  - **Config block** under `improve.*` in `.candid/config.json`: `improve.focus` (default focus area), `improve.noBugs` (default suppress bugs), `improve.maxOpportunities` (cap, default 7). Shared fields (`tone`, `exclude`, `mergeTargetBranches`, `autoCommit`) coexist with `candid-review`'s top-level keys without interference — `focus: "security"` applies to `/candid-review` while `improve.focus: "clarity"` applies to `/candid-improve-implementation`
  - **State persistence**: writes `.candid/last-improve.json` (separate from `.candid/last-review.json`) for future comparisons
  - **Explicit non-overlap clause** at the top of the skill: not a defect hunter, not a feature suggester, not a linter. If multiple findings would belong in `/candid-review`, surface them briefly under 🐛 Bugs and route the user there for proper triage
  - **Comprehensive docs**: dedicated `/docs/core-features/candid-improve-implementation` page with categories, flags table, examples, and a full diff-vs-`candid-review` table
  - **Homepage**: new "Improve" step inserted between Review and Ship in the marketing-page workflow list

## [1.16.0] - 2026-04-25

### Added

- **Candid Chrome QA** (`/candid-chrome-qa`): A new skill that drives a real Chrome session against your running web app, walks the target like a real user across desktop and mobile, runs DOM/console/network probes, and emits structured findings JSON to `.context/findings/<date>-<slug>.json` for downstream triage
  - **Pre-flight protocol**: verifies dev server (curl health check), confirms a fresh Chrome tab, resizes to desktop default (1440x900), navigates and confirms logged-in state, clears the console baseline, and verifies required data is present before any QA work begins. Aborts with a focused error if any check fails — no silent downgrade to source-only review
  - **Per-target flush-capture cycle**: for each route or tab, flush console + network telemetry, exercise 2–3 main interactions plus 1 edge case, capture telemetry against a console-triage table (P0–P3 mapping for the noisy stuff: TypeError, hydration mismatch, CORS, deprecated lifecycle, unmounted setState, etc.) and a network health threshold table (4xx rate, response time, payload size, duplicate requests). Findings appended per-finding, never batched
  - **Mobile pass required by default**: resizes to 390x844 and re-walks the top 5 targets with a 44×44px touch-target probe. Falls back to ~500px if Chrome's UI chrome enforces a larger min content width. Mobile-only bugs surface in roughly 30% of passes
  - **Cross-cutting probes**: a single `javascript_exec` call per pass enumerates icon-only buttons without aria-labels, images without alt text, and inputs without labels — catches DOM-level a11y violations that click-by-click testing misses
  - **Schema v2.0** (best-in-class redesign over the source skill): top-level adds `schemaVersion`, `summary` block (severity + category counts populated at end-of-pass); per-finding adds `category` (bug/a11y/perf/ux/copy/security/compat — separate routing dimension from severity), `viewport` (desktop/mobile/both — first-class mobile signal), `url` (full repro URL), `capturedAt` (per-finding ISO8601 timestamp), `confidence` (definite/likely/suspected); renames `tag` → `surface`; promotes `evidence.consoleErrors` from `string[]` to `[{level, message}]` and `evidence.networkRequests` from `string[]` to `[{method, url, status, durationMs?}]`; drops `body` (pure derivation) and `status` (consumer-owned). v1 triage tool consumers will need migration — see `schemaVersion` field
  - **End-of-pass summary**: writes the `summary` block to JSON and prints to stdout — total finding count, severity breakdown, category breakdown, and the title + URL of every P0/P1 finding. JSON file remains the source of truth; stdout is a courtesy for users without a triage tool
  - **CLI flags**: `--url <url>` (skip URL prompt), `--mobile-only` (invert default to mobile-only)
  - **Hard rules enforced**: never click destructive actions (delete/disconnect/drop/force/publish/purchase) without explicit per-action approval; never silently downgrade to source-only review when data is missing; never invent the schema; never batch-write findings; never skip mobile or cross-cutting probes; never use a stale tab
  - **Pre-flight step 0** detects whether the Claude in Chrome MCP is installed (via `ToolSearch`) and aborts with a clear install link if absent. Batch-loads every browser tool the skill will use so subsequent calls don't pay per-tool ToolSearch overhead
  - **Project-context loading**: pre-flight reads `Technical.md` for QA-relevant rules (browser support matrix, accessibility target, API base path, design-system constraints, auth setup) and an optional `chromeQA` block in `.candid/config.json` (`defaultUrl`, `apiPathPattern`, `desktopViewport`, `mobileViewport`) — keeps the skill from being an island next to the rest of the Candid pack
  - **Deterministic finding IDs**: `id` is now `F-` + the first 8 hex chars of `SHA-1(url|title)`, so the same finding in a re-run gets the same ID and downstream tools can dedup across passes
  - **Deterministic slug + filename collision handling**: file slug derived from the first 4 words of `goal` (lowercased, alphanumerics + hyphens, ≤40 chars). If today's file with the same slug exists, the skill writes to `<YYYY-MM-DD>-<HHmm>-<slug>.json` instead of overwriting
  - **Comprehensive docs**: dedicated `/docs/core-features/candid-chrome-qa` page covering quick start, the flush-capture cycle, edge-case patterns, schema reference with v1→v2 migration table, severity scale → Linear priority mapping, configuration reference, Technical.md integration, and FAQ
  - **Requires** the Claude in Chrome MCP installed in your Claude Code environment and a running web app reachable via HTTP

### Changed

- **Plugin description + keywords** updated in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` to surface the new browser-QA capability for marketplace discovery — added keywords `qa`, `testing`, `browser`, `chrome`, `a11y`, `accessibility`

## [1.15.0] - 2026-04-25

### Added

- **Install step** (`ship.installCommand` / `fastShip.install`): New optional step that runs a dependency-install command before build and tests. Addresses the common failure mode where build/test logs are really stale-dependency errors. Common values: `pnpm install`, `npm ci`, `poetry install`, `bundle install`. Opt-in — leave `installCommand` unset to skip the step entirely
  - **`ship.installCommand`** — runs by default in `/candid-ship` when set, skipped silently when unset
  - **`fastShip.install`** — explicit toggle for `/candid-fast-ship`; requires `ship.installCommand` to be configured
  - **`--skip-install`** flag on `/candid-ship` for one-off skips when deps are known to be current
  - **PR body** now includes an `Install: PASS | SKIPPED` row in the Verification block
  - **Summary output** includes an `Install:` row when `installCommand` is configured

### Changed

- **Shared shipping workflow** extracted to `skills/candid-ship/WORKFLOW.md`. Both `candid-ship` and `candid-fast-ship` now reference this single document for the mechanics of pre-flight, install, build, tests, PR creation, issue tracker, auto-merge, post-merge, and summary. Each skill owns only the **skip semantics** unique to its mode (`--skip-*` flags vs `fastShip.*` toggles). Removes ~80% duplication between the two skill files and substantially reduces tokens loaded per shipping invocation
- **`candid-ship` SKILL.md** trimmed from 631 → ~180 lines. Field-descriptions table now references `skills/candid-review/CONFIG.md` rather than restating it
- **`candid-fast-ship` SKILL.md** trimmed from 532 → ~180 lines. Same dedup pattern
- **Single `git log` call** during PR creation now serves both title generation and body generation (previously three separate calls on the same range)
- **`git rev-list --count`** replaces `git log | head -20` for the commits-ahead pre-flight check

## [1.14.0] - 2026-04-25

### Added

- **Candid Fast Ship** (`/candid-fast-ship`): A new minimal shipping command for low-risk changes. Unlike `/candid-ship` (which runs everything by default and lets you skip steps), `/candid-fast-ship` runs **nothing by default** and only executes the steps you explicitly enable in a new `fastShip` config block. PR creation is the only mandatory step
  - **New `fastShip` config block** (sibling to `ship` in `.candid/config.json`): boolean toggles for `review`, `build`, `tests`, `issueTracker`, `autoMerge`, and `postMergeCommand` — all default to `false`. Optional `targetBranch` override
  - **Inherits configuration from `ship`**: command values (`buildCommand`, `testCommand`, `postMergeCommand`), tracker config (`issueTracker.provider`, `state`, `prompt`, `teamPrefixes`), and target branch all come from the existing `ship` block — `fastShip` only controls which steps run, not how
  - **Use cases**: hotfixes, docs updates, dependency bumps, config changes, or any class of changes where the full review cycle would be overkill
  - **CLI flags**: `--auto-merge` / `--no-auto-merge` (override config), `--dry-run` (preview plan). No `--skip-*` flags — there's nothing to skip when steps are off by default
  - **Graceful skipping**: enabling a step in `fastShip` without the corresponding `ship` configuration shows a clear `SKIPPED — not configured in ship` message rather than failing
  - **candid-init flow**: new Step 10.7 prompts the user to configure `fastShip` after the main ship config is set, with preset options (None / Build only / Build + auto-merge / Custom)
  - **Comprehensive docs**: dedicated `/docs/core-features/candid-fast-ship` page covering quick start, config block, relationship to `ship`, use cases (4 real examples), skip-behavior table, and a comparison table between `candid-ship` and `candid-fast-ship`
  - **Config reference updated**: `docs/reference/config-options` now documents the full `fastShip` schema, and `skills/candid-review/CONFIG.md` covers the validation rules

## [1.13.0] - 2026-04-25

### Added

- **Issue Tracker Integration** (`ship.issueTracker`): New optional step in candid-ship that automatically transitions a tracked issue to a configured state after PR creation
  - **Provider-agnostic schema** (`provider`, `enabled`, `teamPrefixes`, `state`, `prompt`) — built to extend to Asana, Jira, GitHub Issues, Shortcut, etc. Today only `provider: "linear"` is implemented; other values produce a friendly warning with a link to [open a request](https://github.com/ron-myers/candid/issues), and the step is skipped
  - **Configurable prompt with intelligent default** (`ship.issueTracker.prompt`): User-editable template sent to the MCP server, written by `candid-init` into `.candid/config.json` so it's discoverable and easy to edit. Supports `{issueId}`, `{state}`, `{provider}` placeholders. The default prompt encodes four safety invariants: (1) single-issue scope, (2) single-field scope (only `state` changes), (3) idempotent no-op when already in target state, and (4) no fallback search on missing-issue errors. Default: `Update issue {issueId}: set its state to "{state}". Update only this one issue and only its state — do not modify any other issues, fields, or properties. If the issue is already in "{state}", report success without action. If the issue is missing or inaccessible, report the error and stop.` Custom prompts must preserve invariants 1 and 4
  - **Branch-name parsing**: extracts the issue ID using a case-insensitive regex built from `teamPrefixes` (defaults: `DIS`, `ENG`, `DISC`) — easy to edit to match your tracker workspace's team keys
  - **Opt-in & graceful**: disabled by default. Skips silently in every "can't run" scenario — config absent, `enabled: false`, no provider set, unsupported provider, MCP not installed, no matching team prefix in branch, or MCP error. The ship continues regardless. Branches without a tracked issue and repos without an MCP are unaffected
  - **Linear MCP integration**: requires the official Linear MCP server (claude.ai/Linear) when `provider: "linear"`
  - **candid-init flow**: Step 10.6f asks "Yes — Linear / Yes — other tracker (request support) / No, skip" — the "other tracker" option links to the issues page so users can request their tracker, and skips configuration cleanly
  - **Comprehensive docs**: provider setup, MCP installation, branch naming conventions, custom prompt examples, skip-scenario table, and instructions for requesting other providers — see [/docs/core-features/candid-ship#issue-tracker-integration](https://candid.dev/docs/core-features/candid-ship#issue-tracker-integration)
  - **Config reference updated**: `docs/reference/config-options` now documents the full `ship.*` schema including `issueTracker`, and `skills/candid-review/CONFIG.md` covers the validation rules

### Changed

- **candid-ship summary**: Now includes an `Issue:` row when `issueTracker.enabled` is `true`
- **`docs/reference/config-options/page.mdx`**: Now documents the complete `ship` config (was previously absent)

## [1.12.0] - 2026-04-25

### Added

- **Integrated optimization stage in `/candid-init`**: Two new opt-in flags run the `/candid-optimize` audit immediately after Technical.md and config.json are generated, so users get a tightened file in one command (closes #19)
  - `--optimize` — runs the full candid-optimize audit (Technical.md + excludes + register + config) in interactive mode after generation; user chooses to apply all, review each, or skip
  - `--auto-optimize` — runs the audit and applies all recommendations without prompting
  - Default behavior unchanged: when neither flag is passed, candid-init writes the raw generated files and prints a `Tip: run /candid-optimize…` hint
  - Implementation delegates to the existing candid-optimize skill — no analysis logic is duplicated, so verbose/duplicate/low-signal heuristics stay in one place
  - Useful for thorough mode where 5 parallel generation sub-agents can produce cross-section duplicates and verbose rules without joint awareness

## [1.11.0] - 2026-04-19

### Added

- **Post-Merge Command** (`ship.postMergeCommand`): New config field to run a shell command after auto-merge is successfully enabled
  - Fires after `gh pr merge --squash --auto` succeeds — useful for triggering deployments, notifications, or cleanup scripts
  - Conditional execution: only runs when `autoMerge` is enabled and the auto-merge command succeeds
  - Non-blocking: if the command fails, a warning is shown but the workflow is not aborted (the PR is already merging)
  - Shown in ship plan display and summary output
  - Documented in CONFIG.md, candid-ship docs, and example configs

## [1.10.0] - 2026-03-17

### Added

- **Ship Workflow** (`/candid-ship`): New command to orchestrate the full shipping workflow — review, build, test, PR, and merge in one command
  - **Review step**: Runs candid-loop to iteratively fix all code issues before shipping
  - **Build verification**: Runs configured build command (e.g., `npm run build`) with fail-fast abort
  - **Test execution**: Runs configured test command (e.g., `npm test`) with fail-fast abort
  - **PR creation**: Auto-generates PR title and body from git log, creates via `gh pr create`
  - **Auto-merge**: Optionally enables GitHub auto-merge via `gh pr merge --squash --auto`
  - **Configurable**: New `ship` field in config.json for build/test commands, target branch, auto-merge, and additional review prompt
  - **Additional prompt**: Pass extra review context via `ship.additionalPrompt` — e.g., "Focus on security and ensure all API endpoints have auth middleware"
  - **CLI flags**: `--auto-merge`, `--no-auto-merge`, `--skip-review`, `--skip-build`, `--skip-tests`, `--dry-run`
  - **Fail-fast**: Aborts on review incomplete, build failure, or test failure with clear error messages
  - **Pre-flight checks**: Validates `gh` CLI availability, authentication, branch state, and commits ahead before starting
  - **Ship plan**: Displays full execution plan before starting, with `--dry-run` option to preview without executing

### Changed

- **candid-init config builder**: New step 10.6 for ship configuration with auto-detection of build/test commands from package.json, target branch from git branches, and prompts for auto-merge and additional review context
- **CONFIG.md schema**: Added `ship` field with validation rules for `buildCommand`, `testCommand`, `targetBranch`, `autoMerge`, and `additionalPrompt` sub-fields

## [1.9.0] - 2026-02-21

### Added

- **Context Optimization** (`/candid-optimize`): New command to audit and optimize the context candid loads during reviews
  - **Token budget estimation**: Shows breakdown of tokens consumed by Technical.md, decision register, and config files with visual bar chart
  - **Technical.md efficiency analysis**: Identifies verbose rules (>200 chars), near-duplicate rules (keyword overlap), and low-signal rules (no project-specific references) with condensed rewrites and token savings estimates
  - **Exclude pattern scanning**: Detects generated files, build output, vendored code, minified files, lock files, and source maps missing from exclusion config
  - **Decision register optimization**: Recommends "lookup" mode for large registers in "load" mode, suggests pruning resolved entries beyond 100, detects duplicate questions
  - **Config tuning recommendations**: Flags missing config.json, unconfigured merge target branches, and suggests focus modes for large Technical.md files
  - **Interactive apply**: Choose to apply all, review each recommendation, or dry-run only
  - **Section filtering**: `--section technical-md|excludes|register|config` to analyze specific areas
  - **Before/after summary**: Shows token reduction after applying optimizations

## [1.8.0] - 2026-02-21

### Changed

- **candid-init config builder** (Step 10): Replaced the placeholder "auto-detect settings" step with a structured 6-sub-step guided config builder
  - **10.1 — Branch strategy detection**: Runs `git branch -a`, maps to branching strategy (Git Flow, GitHub Flow, trunk-based, legacy), confirms with user via AskUserQuestion with option to customize or skip
  - **10.2 — Exclude pattern detection**: Scans for generated files, vendor directories, build output, and minified files using portable `find` commands; presents detected patterns for confirmation
  - **10.3 — Tone preference**: Interactive prompt for harsh, constructive, or skip (defer to per-review choice)
  - **10.4 — Auto-commit preference**: Interactive prompt to enable or skip (defaults to false)
  - **10.5 — Decision register**: Existing prompt retained for enable/skip
  - **10.6 — Preview and confirm**: Shows assembled JSON for user approval before writing, with option to adjust
  - Explicit note that `focus` field is intentionally skipped — it's a per-review concern, not a project-level default
  - Consistently omits skipped fields rather than writing defaults — sparse configs that age well
  - Handles `main`+`master` coexistence (migration repos) and checks remote branch names

## [1.7.0] - 2026-02-21

### Added

- **Decision Register** (`decisionRegister` config): Track questions and decisions during code reviews
  - **Active knowledge base**: Before asking a question, checks the register for prior answers and reuses them automatically — the same question is never asked twice
  - **Two consultation modes**: `"lookup"` (per-question check, default) or `"load"` (full register in context)
  - **Automatic question capture**: Issues marked "Clarification Needed ?" are recorded in the register
  - **User-initiated questions**: Choose "I have a question about this" during individual fix review
  - **Resolution tracking**: Via answers, re-review detection, or explicit decline
  - **Four statuses**: `open`, `answered`, `superseded`, `declined`
  - **Deduplication**: Avoids duplicate entries for the same logical question
  - **Configurable path**: Default `.candid/register/review-decision-register.md`, customizable via `decisionRegister.path`
  - **Loop mode support**: Prior decisions auto-applied in auto mode; interactive in review-each/interactive modes
  - **Git-friendly**: Register designed to be committed (unlike ephemeral `last-review.json`)
  - **Documentation**: New core feature page, config reference update, homepage feature card

### Changed

- **Fix Confidence Levels**: Added "Clarification Needed ?" level for issues requiring author input
- **Phase 8b (Individual Fix Review)**: New "I have a question about this" option when register is enabled
- **candid-loop auto mode**: Prior decisions from register applied automatically across iterations
- **candid-loop summary**: Shows decision register statistics when enabled
- **candid-init**: Offers option to enable decision register during project initialization

## [1.6.1] - 2026-01-27

### Added

### Changed

### Fixed
- Update Technical.md path references from `.claude/Technical.md` to `.candid/Technical.md` in documentation, templates, and skill files

## [1.6.0] - 2026-01-27

### Added

- **Candid Loop** (`/candid-loop`): New skill that runs candid-review in a loop until all issues are resolved
  - **Three execution modes**:
    - `auto` (default): Automatically applies all fixes without prompting
    - `review-each`: Go through each fix one by one with simple Yes/No prompts
    - `interactive`: Full control with skip, ignore list, and batch options
  - **Configurable max iterations**: Prevent infinite loops with `--max-iterations N` (default: 5)
  - **Category filtering**: Only enforce specific categories with `--categories critical,major`
  - **Ignored issues**: Permanently skip false positives via `.candid/config.json`:
    - `loop.ignored.categories`: Skip entire categories (e.g., `["edge_case"]`)
    - `loop.ignored.patterns`: Skip by title regex (e.g., `["Unicode", "timezone"]`)
    - `loop.ignored.ids`: Skip specific issue IDs from `last-review.json`
  - **Add-to-ignore workflow**: In interactive mode, choose "Add to ignore list" to persist skips
  - **Progress tracking**: Shows iteration count, issues fixed, and detailed summary
  - **Documentation**: New feature page, how-to guide for automated review loops, updated slash commands reference

## [1.5.0] - 2026-01-22

### Added

- **Analysis effort levels for candid-init** (`--effort quick|medium|thorough`): Control how deeply candid-init analyzes your codebase
  - `quick` (~30 sec): Framework detection, directory structure, file suffixes, top imports
  - `medium` (~1-2 min): Adds naming conventions, error patterns, test organization, reads 5-8 key files
  - `thorough` (~5-10 min, default): Launches 3-5 sub-agents to read ALL files in parallel
  - Generated rules now reference specific file paths from your project
  - Pattern-to-rule transformation creates project-specific standards, not generic templates

- **Sub-agent comprehensive analysis in thorough mode**: Parallel agents analyze entire codebase
  - **Architecture Agent**: Reads all controllers/services/repositories, maps dependency graph, finds violations
  - **Naming Agent**: Reads 20-30 files across layers, extracts naming conventions with consistency metrics
  - **Error/Security Agent**: Reads all error handling and auth code, identifies patterns and gaps
  - **Testing Agent**: Reads all test files, documents organization and coverage gaps
  - **Framework Agent**: Reads all React components or API routes (framework-specific)
  - Each agent proposes rules with specific file:line evidence

- **Two-phase sub-agent architecture for 500-line Technical.md**: Thorough mode now generates comprehensive documentation
  - **Phase 1 - Analysis**: 5 parallel agents read ALL files, extract patterns with file:line evidence
  - **Phase 2 - Generation**: 5 parallel agents write sections (~80-120 lines each)
    - Architecture Section Agent: Layer rules, module boundaries, dependency graph
    - Naming Section Agent: File naming, class naming, function naming, variable naming
    - Error Handling Section Agent: Error patterns, logging standards, response formats
    - Testing Section Agent: Test organization, naming conventions, coverage requirements
    - Security & Framework Section Agent: Auth patterns, framework conventions, gaps table
  - Output scales by effort: quick (~50 lines), medium (~150 lines), thorough (~500 lines)
  - Each section includes specific file paths and code examples from the analyzed codebase

- **Architecture analysis in candid-init**: Thorough mode now generates architecture rules with enforcement
  - Detects layer boundaries (controllers/services/repositories) and generates dependency rules
  - Detects module boundaries (feature-based structure) and generates isolation rules
  - Identifies actual violations in the codebase and notes them in Technical.md
  - Rules reference specific paths: "Controllers in `src/controllers/` must not import from `src/repositories/`"

- **Gap analysis in candid-init**: Compares detected patterns to best practices
  - Security gaps: Input validation, parameterized queries, auth middleware
  - Error handling gaps: Custom error classes, consistent response format
  - Testing gaps: Missing test coverage, inconsistent naming
  - TypeScript gaps: Strict mode, any usage count
  - Generates "Gaps vs Best Practices" table in Technical.md

### Changed

- **candid-init generates both Technical.md and config.json**: The init command now creates a complete project setup in the `.candid/` directory
  - Technical.md moved from project root to `.candid/Technical.md`
  - New `.candid/config.json` file generated with auto-detected settings
  - Auto-detects configuration values:
    - `tone`: defaults to "constructive" (safer for teams)
    - `exclude`: parses .gitignore and adds framework-specific patterns
    - `focus`: infers from project structure (auth/ → security, WebSocket → performance)
    - `mergeTargetBranches`: detects from existing git branches (stable, main, master, develop, trunk)
    - `autoCommit`: defaults to false
  - Interactive confirmation flow: "Accept all", "Customize settings", or "Skip config generation"
  - Both files created in `.candid/` directory with proper error handling
  - 9-step workflow (expanded from 7 steps) with enhanced project analysis
  - Prompts for overwrite if existing files found

## [1.4.2] - 2026-01-18

### Added

- **Auto-commit config option** (#12): `autoCommit` field in config files allows defaulting auto-commit behavior
  - Set `"autoCommit": true` in `.candid/config.json` or `~/.candid/config.json` to enable auto-commit by default
  - CLI flag `--auto-commit` still overrides config files
  - Defaults to `false` for backward compatibility
  - Follows same precedence rules as other config options: CLI flag → project config → user config → default

## [1.4.1] - 2026-01-18

### Fixed

- **Plugin update compatibility**: Renamed `templates/Technical-nextjs-vercel-supabase-clerk-loop.md` to `templates/nextjs-stack.md` to fix `ENAMETOOLONG` error during plugin updates. The long path was causing filesystem errors when Claude Code's plugin update process created temporary cache directories.

### Changed

- **Update troubleshooting documentation**: Enhanced the updating guide with step-by-step workaround for `ENAMETOOLONG` errors. Users can now run `claude plugin marketplace update candid` before updating, or follow a force reinstall procedure if needed.

## [1.4.0] - 2026-01-18

### Added

- **Website launched**: Official documentation site now live at www.candid.tools

### Changed

- **Auto-commit flag renamed**: `--auto-commit` is now `--commit` for brevity

## [1.3.0] - 2026-01-17

### Added

- **Automatic commit mode** (`--auto-commit` flag): candid-review can now automatically create git commits after applying fixes
  - Commit message includes detailed list of all applied fixes with file locations and line numbers
  - Only stages files modified by candid-review (preserves other unstaged changes)
  - Includes co-author tag following repository convention
  - Graceful error handling - commit failures preserve applied fixes and continue review
  - Usage: `/candid-review --auto-commit` or combined with other flags like `/candid-review --harsh --auto-commit`

## [1.2.0] - 2026-01-17

### Added

- **Configurable Merge Target Branches**: Specify which branches to compare against when reviewing branch diffs, replacing the hardcoded `main → stable → master` fallback chain.
  - **Config field**: `mergeTargetBranches` accepts an array of branch names (e.g., `["develop", "main"]`)
  - **CLI flag**: `--merge-target <branch>` (repeatable) for one-off overrides
  - **Four-tier precedence**: CLI flags → project config → user config → default (`["main", "stable", "master"]`)
  - **Workflow examples**: New example configs for Git Flow, trunk-based, and GitHub Flow in `examples/`
  - **Graceful fallback**: Tries each branch in order, uses first that exists
  - **Backward compatible**: Default behavior unchanged for existing users

- **Edge-Case Focus Mode** (`--focus edge-case`): New focus mode dedicated to finding boundary conditions and error scenarios
  - Systematically checks every code path for edge cases using comprehensive checklists
  - Finds 2-3x more edge case issues than general reviews
  - Groups related edge cases into comprehensive, actionable issues
  - 8 systematic check categories:
    - Input Validation Matrix: null/undefined, empty collections, type validation, boundary values, special characters, whitespace
    - Async Operation Safety: timeouts, cancellation, error handling, race conditions, double-invocation, state validity
    - Data Structure Edge Cases: empty results, single items, pagination, sorting/filtering, duplicates
    - Network Resilience: timeouts, retry logic, error codes, offline handling, partial failures, loading states
    - State Lifecycle: cleanup, concurrent updates, navigation safety, re-initialization, memory leaks
    - Date/Time Edge Cases: timezone, DST, leap year/second, invalid dates, locale formatting
    - Browser/Environment: API availability, mobile/desktop, keyboard accessibility, storage availability, screen sizes
    - Security Edge Cases: CSRF tokens, session timeout, permission changes, token refresh, XSS vectors
  - Can be set via CLI flag: `/candid-review --focus edge-case`
  - Can be set in config files: `{"focus": "edge-case"}`
  - New documentation: `docs/example-reviews/edge-case-review.md` with side-by-side comparison showing general vs edge-case reviews

- **New Example Configs**:
  - `examples/git-flow/config.json`: Git Flow workflow (develop → main)
  - `examples/trunk-based/config.json`: Trunk-based development (trunk)
  - `examples/github-flow/config.json`: GitHub Flow (main only)

- **New Test Cases**: 5 validation test files for merge target branch configuration
  - `valid-merge-target-single.json`, `valid-merge-target-multiple.json`, `valid-merge-target-with-remote.json`
  - `invalid-merge-target-empty.json`, `invalid-merge-target-string.json`

### Changed

- **Focus Mode Options**: Added "edge-case" as valid value for `focus` field in config files and CLI
- **Config Validation**: Updated to accept "edge-case" alongside "security", "performance", and "architecture"
- **Documentation updates**: README.md, review-scope.md, troubleshooting.md, and ci-cd.md updated with merge target configuration guidance
- **New Step 2.5**: Load Merge Target Branches procedure added to SKILL.md with full validation logic
- **CONFIG.md schema expanded**: Added `mergeTargetBranches` field with validation rules

## [1.1.0] - 2026-01-17

### Added

- **Re-Review Mode** (`--re-review`): Compare current review against a previous review to track progress
  - Shows ✅ Fixed, 🔄 Still Present, and 🆕 New issues
  - Review state automatically saved to `.candid/last-review.json` after each review
  - Stable issue IDs using SHA256 hash of file:line:category:title
  - Net change summary showing improvement or regression

- **Technical.md Validator** (`/candid-validate-standards`): Check your standards file for effectiveness
  - 🌫️ Detects vague rules ("write clean code", "use best practices")
  - 📏 Flags missing thresholds ("keep functions small" → needs number)
  - 🔧 Identifies linter overlap (rules your ESLint/Prettier already handles)
  - `--fix` flag suggests specific rewrites for vague rules

- **New Templates**:
  - `Technical-node.md`: Node.js/backend standards (API design, database, security, async)
  - `Technical-python.md`: Python standards (type hints, testing, asyncio, logging)

- **New Documentation**:
  - `docs/review-scope.md`: How to control what gets reviewed (scope, exclusions, focus, subagents)
  - `docs/technical-md-writing-guide.md`: Good rules vs bad rules with examples
  - `docs/integration/ci-cd.md`: CI/CD integration (GitHub Actions, GitLab, CircleCI, Azure DevOps)
  - `docs/integration/pre-commit.md`: Pre-commit hook setup (Git hooks, Husky, pre-commit framework, Lefthook)

- **Focus Mode Precedence**: Focus area (`--focus security/performance/architecture`) now follows same precedence as tone:
  - CLI flag → project config → user config → no focus (all categories)
  - Can be set in `.candid/config.json` with `"focus": "security"`

- **Fix Confidence Levels**: Each fix now rated to help prioritize:
  - Safe ✓: Mechanical fix, low risk
  - Verify ⚡: Logic change, needs testing
  - Careful ⚠️: Architectural change, may have side effects

### Changed

- **Command definition expanded**: `commands/candid-review.md` now includes full YAML frontmatter with all argument definitions
- **Template references**: `candid-init` now points to actual template files instead of vague descriptions
- **Step 10 added**: Review state saving after completion
- **ID generation specified**: Uses SHA256 hash (first 12 chars) of `${relativePath}:${line}:${category}:${title}`

## [1.0.3] - 2026-01-17

### Added

- **Config File Support for Tone Persistence**: Users can now persist their tone preference across review sessions using config files, eliminating the need to select tone every time.
  - **Three-tier precedence**: CLI flags → project config → user config → interactive prompt
  - **User config**: `~/.candid/config.json` for user-wide defaults
  - **Project config**: `.candid/config.json` for project-specific overrides
  - **Graceful error handling**: Invalid configs show warnings and fall back to next precedence level
  - **Source transparency**: Always shows where tone preference came from
  - **Forward compatibility**: Unknown fields ignored; optional version field for future schema changes
  - **Example configs**: Ready-to-use examples in `examples/harsh/` and `examples/constructive/`
  - **Comprehensive validation**: Uses `jq` for JSON parsing with type and value checks
  - **Documentation**: CONFIG.md with reusable validation procedure, README.md with setup examples

### Changed

- **Step numbering normalized**: Renamed Step 2.5 to Step 3; all subsequent steps renumbered (3→4, 3.5→4.5, 4→5, 5→6, 6→7, 7→8)
- **Phase numbering normalized**: Phase 6a/6b/6c renamed to Phase 7a/7b/7c to match new Step 7
- **New Step 3 (Load Tone Preference)**: Config loading with detailed JSON validation using `jq` commands

## [1.0.2] - 2026-01-15

### Fixed

- **Fix Selection Implementation**: Step 7 now uses sequential yes/no prompts instead of requesting impossible multiselect capability. AskUserQuestion in Conductor doesn't support multiselect, which caused the skill to skip fix selection entirely. The new implementation offers:
  - Phase 7a: Bulk action shortcuts (Apply all, Critical+Major only, Review individually, None)
  - Phase 7b: Individual yes/no prompts for each fix when reviewing individually
  - Phase 7c: Final confirmation with summary before applying selected fixes
- **Step 8 Clarification**: Updated to explicitly reference selectedFixes array from Step 7

## [1.0.1] - 2026-01-14

### Changed

- **Mandatory Fix Selection**: Step 7 now explicitly requires presenting the multiselect prompt whenever issues are found. Added enforcement language to prevent skipping user selection or auto-applying fixes.

## [1.0.0] - 2026-01-13

Initial release of Candid, a rebrand of [radical-candor-code-review](https://github.com/ron-myers/radical-candor-code-review-skill).

### Features

- **Configurable Review Tone**
  - Harsh mode: Brutal honesty with sarcasm
  - Constructive mode: Caring + challenging, full Radical Candor style
  - Tone selection via AskUserQuestion or command-line args (--harsh, --constructive)

- **Technical.md Support**
  - Project-specific standards that inform every review
  - Lookup order: project root, then .candid/Technical.md
  - Issue category: 📜 Standards Violation
  - Template provided in templates/Technical.md
  - Best practices guide in docs/Technical-md-best-practices.md

- **Architectural Context Analysis**
  - Reviews consider file relationships, not just the diff
  - Traces imports/exports to find downstream effects
  - Checks for related test files
  - Reviews recent git history for context

- **Actionable Fixes**
  - Every issue includes concrete code to fix it
  - Fixes are copy-paste ready
  - Language-aware code blocks

- **Todo Integration**
  - Multi-select prompt after review
  - Select specific issues or use shortcuts (All, Critical+Major only)
  - Creates properly formatted todos via TodoWrite

- **Issue Categories**
  - 🔥 Critical: Production killers
  - ⚠️ Major: Serious problems
  - 📜 Standards: Technical.md violations
  - 📋 Code Smell: Maintainability issues
  - 🤔 Edge Case: Unhandled scenarios
  - 💭 Architectural: Design concerns

- **Deep Review Agent**
  - Subagent for complex changes spanning multiple domains
  - Returns structured JSON for main skill to format
  - Applies same standards and categorization

### Notes

- Built on the Radical Candor framework by Kim Scott
- Command: `/candid-review`
