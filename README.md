# Candid

A Claude Code plugin for configurable code reviews that combine thoroughness with actionable feedback. Based on Kim Scott's Radical Candor framework: **Care Personally + Challenge Directly**.

## Features

- **Configurable Tone** - Choose between Harsh (brutal honesty) or Constructive (caring + challenging)
- **Technical.md Support** - Define project standards that inform every review
- **Architectural Context** - Reviews consider file relationships and patterns, not just the diff
- **Actionable Fixes** - Every issue comes with concrete code to fix it
- **Fix Confidence Levels** - Each fix is rated Safe/Verify/Careful to help prioritize
- **Focus Mode** - Review only security, performance, or architecture aspects
- **File Exclusions** - Skip generated code, vendor files, and other noise
- **Auto-Generate Standards** - `/candid-init` creates Technical.md from codebase analysis
- **Todo Integration** - Select issues to add as todos with one multi-select prompt
- **Categorized Issues** - Organized by severity for easy prioritization

## Recommended: Install Superpowers First

I'm a big fan of [Superpowers](https://github.com/obra/superpowers) and recommend installing it before candid. Superpowers provides foundational skills for Claude Code that enhance your overall workflow, and candid builds on top of that foundation nicely.

```bash
/plugin marketplace add obra/superpowers
/plugin install superpowers
```

## Installation

```bash
# From Claude Code
/plugin marketplace add ron-myers/candid
/plugin install candid@candid
```

Then restart Claude Code.

## Updating

To update Candid to the latest version:

```bash
claude plugin update candid@candid
```

Or from within Claude Code:

```bash
/plugin install candid@candid
```

Then restart Claude Code.

See [CHANGELOG.md](CHANGELOG.md) for what's new in each version.

## Usage

### Basic Review

```
/candid-review
```

The skill will:
1. Detect your active changes (git diff)
2. Ask for your preferred tone
3. Review with architectural context
4. Present categorized issues with fixes
5. Let you select which issues to track as todos

### With Tone Preset

```
/candid-review --harsh
/candid-review --constructive
```

Skip the tone prompt and go directly to the review.

### Focus Mode

Review only specific aspects of your code:

```
/candid-review --focus security      # Security vulnerabilities, auth issues
/candid-review --focus performance   # N+1 queries, blocking operations
/candid-review --focus architecture  # Design patterns, coupling, SRP
```

### Exclude Files

Skip generated code, vendor files, or other noise:

```
/candid-review --exclude "*.generated.ts"
/candid-review --exclude "vendor/*" --exclude "*.min.js"
```

Or set exclusions in config (see Configuration below).

### Re-Review Mode

Compare current issues against a previous review:

```
/candid-review --re-review
```

Shows:
- ✅ **Fixed** - Issues from the previous review that are now resolved
- 🔄 **Still Present** - Issues that remain
- 🆕 **New** - Issues introduced since last review

Review state is automatically saved to `.candid/last-review.json` after each review.

### Validate Standards

Check your Technical.md for effectiveness:

```
/candid-validate-standards              # Validate Technical.md
/candid-validate-standards --fix        # Include suggested rewrites
```

Flags:
- 🌫️ Vague rules ("write clean code")
- 📏 Missing thresholds ("keep functions small")
- 🔧 Linter overlap (rules your linter handles)

## Configuration

Candid supports optional config files to persist your tone preference across reviews. No more selecting your preferred tone every time.

### Config Locations

Candid checks for config files in this order (first match wins):

1. **CLI flags:** `--harsh` or `--constructive` (highest priority)
2. **Project config:** `.candid/config.json` (in project root)
3. **User config:** `~/.candid/config.json` (in your home directory)
4. **Interactive prompt** (fallback if no config found)

This means you can set a user-wide default and override it per-project, while CLI flags always take precedence.

### Config Format

```json
{"tone": "harsh"}
```

All fields are optional. See [CONFIG.md](skills/candid-review/CONFIG.md) for the full schema specification including `exclude` patterns and `focus` areas.

### Example Setup

**Set user-wide default (harsh tone):**
```bash
mkdir -p ~/.candid
cp examples/harsh/config.json ~/.candid/config.json
```

**Set user-wide default (constructive tone):**
```bash
mkdir -p ~/.candid
cp examples/constructive/config.json ~/.candid/config.json
```

**Override for a specific project:**
```bash
mkdir -p .candid
cp examples/harsh/config.json .candid/config.json
# Or for constructive:
cp examples/constructive/config.json .candid/config.json
```

**CLI flag always overrides:**
```bash
/candid-review --harsh  # Uses harsh even if config says constructive
```

### Config Files in Action

When candid loads a config, you'll see where the preference came from:

```
Using harsh tone (from user config)
Using constructive tone (from project config)
Using harsh tone (from CLI flag)
Using constructive tone (from interactive prompt)
```

### Example Configs

See the `examples/` directory for ready-to-use config files:
- `examples/harsh/config.json` - Harsh tone config (just copy to `.candid/` or `~/.candid/`)
- `examples/constructive/config.json` - Constructive tone config

### Invalid Configs

If a config file is malformed or has an invalid tone value, candid shows a warning and falls back to the next precedence level:

```
⚠️  Invalid config at .candid/config.json: malformed JSON. Falling back to user config.
```

## Technical.md

Technical.md lets you define project-specific standards that candid enforces during reviews. Violations appear as 📜 Standards Violation.

### Quick Setup

**Option 1: Auto-generate from your codebase**
```
/candid-init              # Auto-detect framework
/candid-init react        # React-specific standards
/candid-init node         # Node.js-specific standards
/candid-init minimal      # Bare minimum starter
```

**Option 2: Copy a template**
```bash
cp templates/Technical-minimal.md ./Technical.md    # Start small
cp templates/Technical-react.md ./Technical.md      # React projects
cp templates/Technical-node.md ./Technical.md       # Node.js backend
cp templates/Technical-python.md ./Technical.md     # Python projects
cp templates/Technical-nextjs-vercel-supabase-clerk-loop.md ./Technical.md  # Next.js full-stack
cp templates/Technical.md ./Technical.md            # Comprehensive template
```

Or create `.claude/Technical.md` if you prefer to keep it out of the project root.

### Keep It Light

**The most important rule: a short Technical.md beats a comprehensive one.**

Your standards doc should be:
- Under 200 lines of actual rules
- Focused on things that matter (security, architecture, non-negotiables)
- Verifiable (specific statements, not vague guidelines)
- Actively pruned (remove rules that aren't being violated)

Skip rules your linter already handles. Skip "nice to haves." Include only what you'd actually block a PR for.

See [Technical.md Best Practices](docs/Technical-md-best-practices.md) for detailed guidance.

### Example Technical.md

```markdown
# Technical Standards

## Non-Negotiables
- All user input validated at API boundary
- No secrets in code (use env vars)
- Database queries must use parameterized statements

## Architecture
- Controllers delegate to services (no business logic in controllers)
- Services never import from controllers

## Testing
- New code requires tests
- Critical paths need integration tests
```

### What Gets Flagged

When your code violates a standard in Technical.md:

```
### 📜 Magic number in retry logic
**File:** src/api/client.ts:42
**Problem:** Uses `3` directly instead of a named constant
**Impact:** Violates standard: "No magic numbers - use named constants"
**Fix:**
```typescript
const MAX_RETRIES = 3;
for (let i = 0; i < MAX_RETRIES; i++) { ... }
```
```

## Issue Categories

| Icon | Category | Priority | Description |
|------|----------|----------|-------------|
| 🔥 | Critical | 1 | Production killers: crashes, security, data loss |
| ⚠️ | Major | 2 | Serious: performance, missing error handling |
| 📜 | Standards | 3 | Technical.md violations |
| 📋 | Code Smell | 4 | Maintainability: complexity, duplication |
| 🤔 | Edge Case | 5 | Unhandled scenarios: null, empty, timeout |
| 💭 | Architectural | 6 | Design: coupling, SRP violations |

## Fix Confidence Levels

Each fix is rated to help you decide how to proceed:

| Level | Icon | Meaning |
|-------|------|---------|
| Safe | ✓ | Mechanical fix, low risk. Apply confidently. |
| Verify | ⚡ | Logic change, needs testing. Review before applying. |
| Careful | ⚠️ | Architectural change, may have side effects. Test thoroughly. |

## Todo Integration

After the review, you'll see a multi-select prompt:

```markdown
Which issues should I add to your todo list?

[ ] 🔥 1. Null check missing in UserService
[ ] ⚠️ 2. N+1 query in OrderRepository
[ ] 📜 3. Magic number violates Technical.md
[ ] 📋 4. Function exceeds 50 lines

Shortcuts:

[ ] All issues
[ ] Critical + Major only
```

Selected issues become todos you can track throughout your session.

## Repository Structure

```
candid/
├── .claude-plugin/
│   ├── plugin.json           # Plugin metadata
│   └── marketplace.json      # Marketplace config
├── commands/
│   ├── candid-review.md      # /candid-review command
│   ├── candid-init.md        # /candid-init command
│   └── candid-validate-standards.md  # /candid-validate-standards command
├── skills/
│   ├── candid-review/
│   │   ├── SKILL.md          # Main review skill
│   │   └── CONFIG.md         # Config validation
│   ├── candid-init/
│   │   └── SKILL.md          # Technical.md generator
│   └── candid-validate-standards/
│       └── SKILL.md          # Technical.md validator
├── agents/
│   └── code-reviewer.md      # Deep review agent
├── templates/
│   ├── Technical.md          # Comprehensive template
│   ├── Technical-minimal.md  # Minimal starter (15 rules)
│   ├── Technical-react.md    # React/frontend template
│   ├── Technical-node.md     # Node.js/backend template
│   ├── Technical-python.md   # Python template
│   └── Technical-nextjs-vercel-supabase-clerk-loop.md  # Next.js full-stack + Loop.so
├── docs/
│   ├── getting-started.md    # 5-minute quickstart
│   ├── review-scope.md       # Controlling what gets reviewed
│   ├── troubleshooting.md    # FAQ and common issues
│   ├── team-adoption.md      # Rolling out to teams
│   ├── Technical-md-best-practices.md
│   ├── technical-md-writing-guide.md  # How to write effective rules
│   ├── integration/
│   │   ├── ci-cd.md          # CI/CD integration guide
│   │   └── pre-commit.md     # Pre-commit hook setup
│   └── example-reviews/
│       ├── security-review.md
│       ├── performance-review.md
│       └── clean-code-review.md
├── examples/
│   ├── harsh/config.json
│   └── constructive/config.json
├── README.md
├── LICENSE
└── CHANGELOG.md
```

## Development

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with real code reviews
5. Submit a pull request

## Philosophy

This plugin is built on the Radical Candor principle that the best feedback:

1. **Cares Personally** - Shows you understand the context and difficulty
2. **Challenges Directly** - Doesn't hedge or soften real issues

Whether you choose Harsh or Constructive tone, every review aims to:
- Find real issues before production
- Provide fixes you can apply immediately
- Help you track what needs to be done
- Teach patterns that prevent future issues

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Ron Myers

## Documentation

- [Getting Started](docs/getting-started.md) - 5-minute quickstart
- [Review Scope](docs/review-scope.md) - Controlling what gets reviewed
- [Troubleshooting](docs/troubleshooting.md) - FAQ and common issues
- [Team Adoption](docs/team-adoption.md) - Rolling out to your team
- [Technical.md Best Practices](docs/Technical-md-best-practices.md) - Writing effective standards
- [Technical.md Writing Guide](docs/technical-md-writing-guide.md) - Good rules vs bad rules
- [CI/CD Integration](docs/integration/ci-cd.md) - Automate reviews in pipelines
- [Pre-Commit Hooks](docs/integration/pre-commit.md) - Review before every commit
- [Example Reviews](docs/example-reviews/) - See what reviews look like

## Links

- [GitHub Repository](https://github.com/ron-myers/candid)
- [Report Issues](https://github.com/ron-myers/candid/issues)
