# Review Scope

Control what Candid reviews and how deeply.

## What Gets Reviewed by Default

Candid detects changes in this priority order:

1. **Staged changes** (`git diff --cached`) - Files you've `git add`ed
2. **Unstaged changes** (`git diff`) - Modified files not yet staged
3. **Branch diff** (`git diff main...HEAD`) - All commits since branching from main/stable

The first non-empty result is reviewed. This means:
- If you have staged changes, only those are reviewed
- If nothing is staged but files are modified, those are reviewed
- If your working directory is clean, the entire branch diff is reviewed

## Reviewing Specific Files

To review specific files or directories, pass them as arguments:

```bash
# Review only auth-related files
/candid-review src/auth/

# Review a specific file
/candid-review src/services/payment.ts

# Review multiple paths
/candid-review src/auth/ src/middleware/auth.ts
```

This overrides the automatic detection and reviews only the specified paths.

## Excluding Files

### Via CLI Flag

Exclude files matching glob patterns:

```bash
# Skip generated code
/candid-review --exclude "*.generated.ts"

# Multiple exclusions
/candid-review --exclude "*.generated.ts" --exclude "vendor/*"
```

### Via Config File

Add exclusions to `.candid/config.json` (project) or `~/.candid/config.json` (user):

```json
{
  "exclude": [
    "*.generated.ts",
    "*.min.js",
    "vendor/*",
    "**/node_modules/**"
  ]
}
```

Config exclusions are merged with CLI exclusions.

### Common Exclusion Patterns

| Pattern | Excludes |
|---------|----------|
| `*.generated.ts` | Generated TypeScript files |
| `*.min.js` | Minified JavaScript |
| `vendor/*` | Third-party vendor code |
| `**/*.test.ts` | Test files |
| `**/migrations/*` | Database migrations |
| `dist/*` | Build output |

## Large Change Handling

For large diffs (500+ lines), Candid may:

1. **Ask which files to prioritize** - Review critical files first
2. **Batch the review** - Process files in groups
3. **Dispatch subagents** - Parallel review for complex changes

You'll be informed when this happens and can guide the process.

## Subagent Dispatch

For complex changes, Candid automatically dispatches specialized subagents for deeper analysis:

### Triggers

Subagents are dispatched when:
- More than 5 files are changed
- Changes span multiple domains (frontend + backend + database)
- Changes touch authentication, authorization, or security
- Changes affect API contracts or database schema

### What Subagents Do

The `code-reviewer` subagent performs:
- Deep architectural analysis
- Cross-file dependency checking
- Security-focused review for auth code
- Performance analysis for database changes

Results are merged into the main review with appropriate categorization.

## Focus Mode

Limit reviews to specific concern areas:

```bash
# Security-focused review
/candid-review --focus security

# Performance-focused review
/candid-review --focus performance

# Architecture-focused review
/candid-review --focus architecture
```

### What Each Focus Checks

| Focus | Categories |
|-------|------------|
| `security` | 🔥 Critical (security), ⚠️ Major (auth/validation) |
| `performance` | ⚠️ Major (N+1, blocking), 📋 Code Smell (complexity) |
| `architecture` | 💭 Architectural, 📋 Code Smell (coupling), 📜 Standards |

Without focus, all categories are checked (default).

Focus can also be set in config:

```json
{
  "focus": "security"
}
```

CLI flag overrides config.

## Binary Files

Binary files are detected and noted but not reviewed. You'll see them listed in the summary but no issues will be raised for their content.

## Review Depth

Candid doesn't just look at the diff—it reads the full file and checks:

- **Imports/exports** - What the code depends on and exposes
- **Related tests** - Whether tests exist for changed code
- **Recent history** - Recent commits for context
- **Project standards** - Technical.md violations

This enables catching issues that aren't visible in the diff alone, like breaking changes to exported APIs or missing test coverage.

## Tips

1. **Stage intentionally** - Stage only what you want reviewed for faster feedback
2. **Use focus mode** - `--focus security` before sensitive changes
3. **Exclude noise** - Add generated files to exclusions permanently
4. **Review incrementally** - Smaller, focused reviews catch more issues
