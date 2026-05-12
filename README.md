<p align="center">
  <img src="assets/logo.svg" alt="Candid Logo" width="250"/>
</p>

# Candid

A coding-agent plugin for configurable code reviews that combine thoroughness with actionable feedback. Runs on **Claude Code** and **Codex CLI** from the same install. Based on Kim Scott's Radical Candor framework: **Care Personally + Challenge Directly**.

## Overview

Candid provides AI-powered code reviews that catch issues before production while teaching you better patterns. Choose between Harsh (brutal honesty) or Constructive (caring + challenging) tone. Define project-specific standards in Technical.md that get enforced automatically. Every issue comes with concrete fixes rated by confidence level.

## Core Workflow

The review process follows these steps:

1. Run `/candid-review` on your changes
2. Select your preferred tone (Harsh or Constructive)
3. Candid reviews with full architectural context
4. Get categorized issues with actionable fixes
5. Select which issues to track as todos
6. Apply fixes and optionally auto-commit

## Key Features

- **Configurable Tone** - Harsh (brutal honesty) or Constructive (caring + challenging)
- **Technical.md Support** - Define and enforce project-specific coding standards
- **Focus Modes** - Target reviews on security, performance, architecture, or edge cases
- **Actionable Fixes** - Every issue includes concrete code with confidence ratings
- **Re-Review** - Track progress on fixes across review sessions
- **Auto-Commit** - Automatically commit applied fixes with detailed messages
- **Todo Integration** - Convert issues to tracked todos with multi-select
- **Issue Categorization** - Organized by severity (Critical → Architectural)
- **Context Optimization** - Audit and optimize token usage for leaner, deeper reviews
- **Live Browser QA** - Drive a real Chrome session against your running app, walk it like a real user across desktop and mobile, and emit structured findings JSON ready for triage

## Installation

### Claude Code

```bash
npx skills add https://github.com/ron-myers/candid
```

Then restart Claude Code.

### Codex CLI

In an interactive Codex session:

```
/plugins
```

Add the marketplace via GitHub shorthand (`ron-myers/candid`), install `candid`, then verify with `/skills`. Invoke skills via `$skill-name` mention syntax (e.g., `$candid-review --harsh`). See [docs/codex/install.md](docs/codex/install.md) for the full command-to-skill mapping.

## Quick Start

**Basic review:**
```
/candid-review
```

**With tone preset:**
```
/candid-review --harsh
/candid-review --constructive
```

**Focus on specific aspects:**
```
/candid-review --focus security
/candid-review --focus performance
```

**Auto-commit applied fixes:**
```
/candid-review --auto-commit
```

**Live browser QA pass:**
```
/candid-chrome-qa
```

Drives a real Chrome session against your running app, walks it like a real user across desktop and mobile, and writes structured findings to `.context/findings/<date>-<slug>.json`. See [Candid Chrome QA docs](https://www.candid.tools/docs/core-features/candid-chrome-qa) for the full workflow and v2.0 schema reference.

## Documentation

Full documentation at [www.candid.tools](https://www.candid.tools):

- **[Getting Started](https://www.candid.tools/docs/get-started)** - Installation and first review
- **[Core Features](https://www.candid.tools/docs/core-features)** - Tone selection, focus modes, Technical.md
- **[Team Setup](https://www.candid.tools/docs/how-to-guides/team-setup)** - Rolling out to your team
- **[Custom Standards](https://www.candid.tools/docs/how-to-guides/custom-standards)** - Writing effective Technical.md rules
- **[Complete Reference](https://www.candid.tools/docs/reference)** - All configuration options and flags
- **[FAQ & Troubleshooting](https://www.candid.tools/docs/tips-troubleshooting/faq)** - Common issues and solutions

## Technical.md

Define project-specific standards that Candid enforces during reviews. Violations appear as 📜 Standards Violation in your review.

**Quick setup:**
```
/candid-init                    # Auto-generate from codebase (thorough analysis)
/candid-init react              # React-specific standards
/candid-init minimal            # Minimal starter
/candid-init --effort quick     # Fast analysis (~30 sec)
/candid-init --effort thorough  # Deep analysis (~3-5 min, default)
/candid-init --optimize         # Run /candid-optimize after generation
```

**Or copy a template:**
```bash
cp templates/Technical-minimal.md ./Technical.md
cp templates/Technical-react.md ./Technical.md
cp templates/Technical-node.md ./Technical.md
```

Keep it focused: under 500 lines, verifiable rules only. Skip what your linter handles. See the [Custom Standards guide](https://www.candid.tools/docs/how-to-guides/custom-standards) for detailed guidance.

## Configuration

Persist your tone preference and other settings in config files:

**User-wide default:**
```bash
mkdir -p ~/.candid
echo '{"tone": "harsh"}' > ~/.candid/config.json
```

**Project-specific:**
```bash
mkdir -p .candid
echo '{"tone": "constructive", "autoCommit": true}' > .candid/config.json
```

See the [Config Reference](https://www.candid.tools/docs/reference/config-options) for all options including `exclude` patterns, `focus` areas, and `mergeTargetBranches`.

## Philosophy

This plugin is built on the Radical Candor principle that the best feedback:

1. **Cares Personally** - Shows understanding of context and difficulty
2. **Challenges Directly** - Doesn't hedge or soften real issues

Whether you choose Harsh or Constructive tone, every review aims to find real issues before production, provide immediately applicable fixes, help you track what needs doing, and teach patterns that prevent future problems.

## Updating

```bash
claude plugin update candid@candid
```

Then restart Claude Code. See [CHANGELOG.md](CHANGELOG.md) for version history.

## Links

- [GitHub Repository](https://github.com/ron-myers/candid)
- [Documentation](https://www.candid.tools)
- [Report Issues](https://github.com/ron-myers/candid/issues)
- [Changelog](CHANGELOG.md)

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Ron Myers
