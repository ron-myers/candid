# Technical Standards

Minimal standards for any project. Expand as needed.

---

## Security (Non-Negotiable)

- All user input validated at API boundary
- No secrets in code (use environment variables)
- Database queries use parameterized statements
- Authentication required for non-public endpoints

---

## Error Handling

- All I/O operations have error handling
- Errors logged with context (what failed, why)
- User-facing errors are helpful, not technical

---

## Code Quality

- Functions under 50 lines
- No magic numbers (use named constants)
- No commented-out code in main branches

---

## Testing

- New features require tests
- Bug fixes include regression tests
- Tests don't depend on external services

---

## Git

- Commits describe why, not what
- No force push to main/master
- PRs require review before merge
