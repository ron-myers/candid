# Technical.md Best Practices

Your Technical.md file defines the standards that candid-review enforces. Keep it **focused and actionable**.

## The Golden Rule: Keep It Light

A bloated standards document is worse than none at all. If developers can't scan it quickly, they won't use it.

**Aim for:** 50-100 lines of actual rules (not including examples)

**Red flags your Technical.md is too heavy:**
- Takes more than 2 minutes to read
- Contains "nice to have" items
- Duplicates what linters already catch
- Includes aspirational standards you don't actually enforce

## What to Include

### Must-Have Standards
Rules that, if violated, would:
- Cause production incidents
- Create security vulnerabilities
- Make code unmaintainable
- Break team workflows

### Skip These
- Style rules your linter handles (ESLint, Prettier)
- Generic best practices everyone knows
- Rules you wouldn't actually reject a PR for
- Detailed explanations (link to docs instead)

## Writing Effective Rules

### Good Rules Are:

**Specific and verifiable**
```markdown
# Good
- API responses must include `request_id` header

# Bad
- APIs should be well-designed
```

**Actionable**
```markdown
# Good
- Functions must be under 50 lines

# Bad
- Keep functions small
```

**Prioritized**
Put critical rules (security, data integrity) at the top. Nice-to-haves belong in a wiki, not here.

## Example: Minimal Technical.md

A focused Technical.md might look like this:

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

## Git
- Conventional commits required
- No force push to main
```

That's it. ~20 lines of rules. Everything else is noise.

## Iteration Strategy

1. **Start minimal** - Only rules you'd actually block a PR for
2. **Add rules reactively** - When an incident or review catches a pattern
3. **Prune quarterly** - Remove rules that aren't being violated

## Integration with candid-review

When candid-review finds a Technical.md violation, it shows:

```
### 📜 Missing input validation
**File:** src/api/users.ts:42
**Problem:** User email used without validation
**Impact:** Violates standard: "All user input validated at API boundary"
```

The more precise your rules, the more useful these violations become.

## Anti-Patterns

### The Encyclopedia
```markdown
# Bad: 500+ lines covering every possible scenario
## JavaScript Best Practices
### Variable Naming
Variables should be named descriptively...
[200 lines of JavaScript wisdom]
```

### The Wishlist
```markdown
# Bad: Aspirational standards
- 100% test coverage
- Zero technical debt
- Documentation for everything
```

### The Duplicate
```markdown
# Bad: Rules your tools already enforce
- Use 2-space indentation (Prettier handles this)
- No unused variables (ESLint catches this)
```

## Summary

| Do | Don't |
|----|-------|
| Keep under 100 lines of rules | Create an encyclopedia |
| Focus on what matters | Include nice-to-haves |
| Write verifiable statements | Write vague guidelines |
| Update based on incidents | Add rules preemptively |
| Prune regularly | Let it grow unbounded |

A Technical.md that developers actually read beats a comprehensive one they ignore.
