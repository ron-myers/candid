# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **Step 2.5 Added to SKILL.md**: New config loading step with detailed JSON validation using `jq` commands
- **Step numbering**: Original Step 3 renumbered; all subsequent steps shifted accordingly

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
