# Candid

A Claude Code plugin for configurable code reviews that combine thoroughness with actionable feedback. Based on Kim Scott's Radical Candor framework: **Care Personally + Challenge Directly**.

## Features

- **Configurable Tone** - Choose between Harsh (brutal honesty) or Constructive (caring + challenging)
- **Technical.md Support** - Define project standards that inform every review
- **Architectural Context** - Reviews consider file relationships and patterns, not just the diff
- **Actionable Fixes** - Every issue comes with concrete code to fix it
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
/plugin install candid
```

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

## Technical.md

Technical.md lets you define project-specific standards that candid enforces during reviews. Violations appear as 📜 Standards Violation.

### Quick Setup

```bash
# Copy the template to your project
cp templates/Technical.md ./Technical.md
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
│   └── candid-review.md      # /candid-review command
├── skills/
│   └── candid-review/
│       └── SKILL.md          # Main skill
├── agents/
│   └── code-reviewer.md      # Deep review agent
├── templates/
│   └── Technical.md          # Template for projects
├── docs/
│   └── Technical-md-best-practices.md
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

## Links

- [GitHub Repository](https://github.com/ron-myers/candid)
- [Report Issues](https://github.com/ron-myers/candid/issues)
