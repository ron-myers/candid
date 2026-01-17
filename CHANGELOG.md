# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-17

### Added

- **Configurable Merge Target Branches**: Specify which branches to compare against when reviewing branch diffs, replacing the hardcoded `main → stable → master` fallback chain.
  - **Config field**: `mergeTargetBranches` accepts an array of branch names (e.g., `["develop", "main"]`)
  - **CLI flag**: `--merge-target <branch>` (repeatable) for one-off overrides
  - **Four-tier precedence**: CLI flags → project config → user config → default (`["main", "stable", "master"]`)
  - **Workflow examples**: New example configs for Git Flow, trunk-based, and GitHub Flow in `examples/`
  - **Graceful fallback**: Tries each branch in order, uses first that exists
  - **Backward compatible**: Default behavior unchanged for existing users

- **New Example Configs**:
  - `examples/git-flow/config.json`: Git Flow workflow (develop → main)
  - `examples/trunk-based/config.json`: Trunk-based development (trunk)
  - `examples/github-flow/config.json`: GitHub Flow (main only)

- **New Test Cases**: 5 validation test files for merge target branch configuration
  - `valid-merge-target-single.json`, `valid-merge-target-multiple.json`, `valid-merge-target-with-remote.json`
  - `invalid-merge-target-empty.json`, `invalid-merge-target-string.json`

### Changed

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
  - Lookup order: project root, then .claude/Technical.md
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
