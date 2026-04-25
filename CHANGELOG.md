# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
