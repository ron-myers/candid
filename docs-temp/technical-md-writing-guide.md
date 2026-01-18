# Technical.md Writing Guide

How to write standards that Candid can actually enforce.

## The Goal

A good Technical.md rule is:
1. **Specific** - Clear enough to check yes/no
2. **Verifiable** - Can be detected in code
3. **Actionable** - Clear what to do when violated
4. **Worth blocking** - You'd actually reject a PR for this

## Good Rules vs Bad Rules

### ❌ Bad: Vague Guidelines

```markdown
## Code Quality
- Write clean code
- Keep functions small
- Use meaningful names
- Follow best practices
```

**Why it fails:**
- "Clean code" is subjective
- "Small" is undefined
- "Meaningful" varies by context
- "Best practices" is circular

### ✅ Good: Specific Standards

```markdown
## Code Quality
- Functions must be under 50 lines
- No single-letter variable names except loop counters (i, j, k)
- Boolean variables/functions use is/has/should prefix
- No commented-out code in main branch
```

**Why it works:**
- "50 lines" is measurable
- "Single-letter except loop counters" is specific
- "is/has/should prefix" is verifiable
- "No commented-out code" is binary

## Writing Verifiable Rules

### The Verification Test

For each rule, ask: "Can I point to specific code and say 'this violates the rule'?"

| Rule | Verifiable? | Why |
|------|-------------|-----|
| "Functions should be readable" | ❌ | Subjective |
| "Functions under 50 lines" | ✅ | Count lines |
| "Use good error handling" | ❌ | Vague |
| "All async functions must have try/catch" | ✅ | Check for try/catch |
| "Write tests" | ❌ | No threshold |
| "New features require at least one test file" | ✅ | Check for test file |

### Quantify When Possible

Turn vague guidance into numbers:

| Vague | Specific |
|-------|----------|
| "Keep functions short" | "Functions under 50 lines" |
| "Don't nest too deep" | "Maximum 4 levels of nesting" |
| "Limit parameters" | "Maximum 5 parameters per function" |
| "Comment complex code" | "Functions over 30 lines need a docstring" |

### Use Patterns, Not Preferences

Bad: "Use modern JavaScript features"
Good: "Use `const` by default, `let` only when reassigning, never `var`"

Bad: "Structure components well"
Good: "One React component per file, max 200 lines"

Bad: "Handle errors properly"
Good: "All fetch calls must have .catch() or be in try/catch"

## Categories of Rules

### 1. Security (Always Include)

These prevent vulnerabilities:

```markdown
## Security

- All user input validated at API boundary
- Database queries use parameterized statements or ORM
- No secrets in code (use environment variables)
- Passwords hashed with bcrypt (cost ≥ 12) or Argon2
- Authentication required for non-public endpoints
- No dangerouslySetInnerHTML with user-provided content
```

### 2. Architecture (Define Structure)

These enforce your chosen patterns:

```markdown
## Architecture

- Controllers delegate to services; no business logic in controllers
- Services never import from controllers
- Components in /components, pages in /pages, utils in /utils
- Shared types in /types, not colocated with components
- No circular imports
```

### 3. Error Handling (Prevent Silent Failures)

```markdown
## Error Handling

- All I/O operations have error handling (try/catch or .catch)
- Errors logged with context (what failed, why)
- User-facing errors are helpful messages, not stack traces
- Unhandled promise rejections crash the process (fail fast)
```

### 4. Testing (Set Expectations)

```markdown
## Testing

- New features require tests
- Bug fixes include regression tests
- Test files colocated with source: foo.ts → foo.test.ts
- Integration tests for API endpoints
- No `any` casts in test files
```

### 5. Performance (Prevent Common Issues)

```markdown
## Performance

- No N+1 queries (use eager loading or batching)
- List endpoints must support pagination
- Large responses streamed, not buffered
- No blocking operations in request handlers
```

## What NOT to Include

### Don't Duplicate Linters

If ESLint/Prettier/Ruff already handles it, skip it:

❌ Don't include:
- Semicolon usage
- Quote style
- Indentation
- Import sorting
- Unused variables

These are already caught by your linter.

### Don't Include Preferences

Unless the team has agreed, skip personal preferences:

❌ Skip:
- "Prefer functional over class components"
- "Use arrow functions"
- "Avoid for loops"

These create friction without preventing bugs.

### Don't Include Obvious Things

❌ Skip:
- "Don't commit syntax errors"
- "Code must compile"
- "Tests must pass"

These are caught by CI, not code review.

## Technical.md Maintenance

### Quarterly Review

Every 3 months, review your Technical.md:

1. **Remove unused rules** - If nothing violates it, it's not needed
2. **Clarify violated rules** - If the same rule is violated repeatedly, it may be unclear
3. **Add patterns from incidents** - Post-incident, codify what would have prevented it
4. **Prune duplicates** - Remove rules your linter now handles

### Adding New Rules

When adding a rule:

1. **Start with an incident** - What bug/issue prompted this?
2. **Write it specific** - Use the verification test
3. **Get team buy-in** - Rules without consensus create friction
4. **Test it** - Run a review and see if it catches the issue

### Deprecating Rules

When removing a rule:

1. **Comment it out first** - Keep it visible for one quarter
2. **Note why removed** - "Removed: now handled by ESLint rule X"
3. **Then delete** - Remove completely after the quarter

## Examples by Framework

### React Technical.md Additions

```markdown
## React Patterns

- One component per file (max 200 lines)
- Hooks at top level only (no conditionals)
- Use useCallback for functions passed to children
- Error boundaries wrap route-level components
- No inline object/array creation in JSX
```

### Node.js API Additions

```markdown
## API Patterns

- All endpoints return consistent error format: { error: { code, message } }
- Rate limiting on public endpoints
- Request validation at controller entry
- Transactions for multi-table operations
- Connection pooling for database access
```

### Python Additions

```markdown
## Python Patterns

- Type hints on all public function signatures
- Docstrings on modules, classes, and public functions
- No mutable default arguments
- Use pathlib for file paths
- Context managers for resource cleanup
```

## Rule Templates

### Input Validation

```markdown
- [Input type] validated at [boundary] before [operation]
```

Examples:
- User input validated at API boundary before database queries
- File uploads validated for type and size before storage
- Configuration validated at startup before server starts

### Resource Management

```markdown
- [Resource] must be [action] in [context]
```

Examples:
- Database connections must be returned to pool after use
- File handles must be closed in finally block or context manager
- Subscriptions must be unsubscribed on component unmount

### Naming Conventions

```markdown
- [Thing] uses [pattern] naming: [example]
```

Examples:
- Boolean variables use is/has/should prefix: isLoading, hasError
- Event handlers use handle prefix: handleClick, handleSubmit
- Test files use .test suffix: user.test.ts, api.test.ts

### Structural Rules

```markdown
- [Thing] in [location], never in [wrong location]
```

Examples:
- Business logic in services, never in controllers
- API types in /types/api, never colocated with components
- Database queries in repositories, never in route handlers

## Common Mistakes

### Too Many Rules

A 500-line Technical.md won't be read. Target 50-100 lines of actual rules.

### Too Strict

Blocking every commit for minor issues creates resentment. Reserve blocking for:
- Security vulnerabilities
- Data loss risks
- Critical architecture violations

### Not Updated

Stale rules lose credibility. If something hasn't been violated in 6 months, consider removing it.

### No Rationale

Rules without "why" feel arbitrary. Add brief context:

```markdown
## Database

- Use transactions for multi-table operations
  <!-- Prevents partial updates that corrupt data -->

- No SELECT * in production code
  <!-- Avoids breaking changes when columns are added -->
```

## Quick Reference

| Good Rule | Bad Rule |
|-----------|----------|
| "Functions under 50 lines" | "Keep functions small" |
| "No console.log in production" | "Clean up debug code" |
| "API errors return { error: { code, message } }" | "Handle errors properly" |
| "Passwords hashed with bcrypt cost ≥ 12" | "Use secure password storage" |
| "One component per file, max 200 lines" | "Keep components organized" |

Remember: The best Technical.md is short, specific, and actually enforced.
