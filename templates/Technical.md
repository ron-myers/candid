# Technical Standards

This file defines your project's technical standards. The candid-review skill reads this file and flags violations as 📜 Standards Violation during code reviews.

**Setup:** Copy this file to your project root as `Technical.md` or place it in `.claude/Technical.md`.

---

## Architecture

Define your architectural patterns and rules:

```
Example patterns to document:
- Layered architecture (controllers -> services -> repositories)
- Dependency direction (dependencies point inward)
- Module boundaries (what can import what)
```

### Layers
- Controllers handle HTTP, delegate to services
- Services contain business logic, call repositories
- Repositories handle data access only
- No circular dependencies between layers

### Dependency Rules
- UI components may not import from repositories directly
- Services must not import from controllers
- Shared utilities go in `/lib` or `/utils`

---

## Code Style

Define naming and organization conventions:

### Naming
- Components: PascalCase (`UserProfile.tsx`)
- Functions: camelCase (`getUserById`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase with prefix (`IUserService`, `TUserResponse`)

### File Organization
- One component per file
- Tests adjacent to source (`user.ts`, `user.test.ts`)
- Group by feature, not by type

### Comments
- Public APIs must have JSDoc/docstrings
- Complex logic requires inline explanation
- TODOs must include author and date

---

## Quality Gates

Define non-negotiable quality requirements:

### Testing
- Minimum 80% code coverage for new code
- All public functions must have unit tests
- Critical paths require integration tests
- No skipped tests in CI

### Performance
- API responses under 200ms (p95)
- No blocking operations on main thread
- Pagination required for lists over 50 items

### Security
- All user input must be validated
- SQL queries must use parameterized statements
- Secrets never in code (use environment variables)
- Authentication required for all non-public endpoints

### Accessibility
- All images must have alt text
- Interactive elements must be keyboard accessible
- Color contrast must meet WCAG AA

---

## Technology-Specific

Add rules for your specific tech stack:

### TypeScript
- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Prefer interfaces over type aliases for objects
- Use enums for fixed sets of values

### React
- Functional components only (no class components)
- Hooks must follow rules of hooks
- Memoize expensive computations
- Avoid prop drilling (use context for 3+ levels)

### Node.js
- Use async/await (no raw promises or callbacks)
- Handle all promise rejections
- Graceful shutdown on SIGTERM
- Structured logging (JSON format)

### Database
- All queries must use indexes
- No SELECT * in production code
- Migrations must be reversible
- Connection pooling required

---

## Team Conventions

Define team-specific practices:

### Code Review
- Reviews required from 2 team members
- Address all comments before merge
- Squash commits on merge

### Documentation
- README required for each module
- API changes require documentation update
- Breaking changes need migration guide

### Git
- Conventional commits (feat:, fix:, docs:, etc.)
- Branch names: `type/description` (feature/add-auth)
- No force push to main/master

---

## Custom Rules

Add your project-specific rules here:

```
Examples:
- All API responses must include request_id
- Feature flags required for new features
- Deprecated code must be removed within 2 sprints
```

---

## Notes

- This file is checked at every code review
- Violations appear as 📜 Standards Violation
- Update this file as your standards evolve
- Consider version controlling this file
