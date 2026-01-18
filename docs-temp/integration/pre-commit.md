# Pre-Commit Hook Setup

Run Candid reviews automatically before every commit.

## When to Use Pre-Commit Reviews

Pre-commit reviews work best when:
- You want immediate feedback before code leaves your machine
- Your team has agreed to block commits with critical issues
- Reviews are fast enough (small, focused commits)

Consider CI/CD instead when:
- Reviews are slow (large commits, many files)
- You don't want to block local development flow
- You prefer reviewing at PR time

## Option 1: Git Hook (Simple)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Run Candid review on staged changes
echo "Running Candid code review..."

# Use harsh mode for quick, direct feedback
OUTPUT=$(claude code "/candid-review --harsh" 2>&1)
EXIT_CODE=$?

echo "$OUTPUT"

# Check for critical issues
if echo "$OUTPUT" | grep -q "🔥"; then
    echo ""
    echo "❌ Critical issues found. Please fix before committing."
    echo "   To bypass: git commit --no-verify"
    exit 1
fi

# Check for major issues (optional - remove if too strict)
if echo "$OUTPUT" | grep -q "⚠️"; then
    echo ""
    echo "⚠️  Major issues found. Consider fixing before committing."
    echo "   To bypass: git commit --no-verify"
    # Uncomment to block on major issues:
    # exit 1
fi

echo "✅ Code review passed"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Option 2: Pre-Commit Framework

Use the [pre-commit](https://pre-commit.com/) framework for better management.

### Setup

1. Install pre-commit:
```bash
pip install pre-commit
# or
brew install pre-commit
```

2. Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: local
    hooks:
      - id: candid-review
        name: Candid Code Review
        entry: bash -c 'claude code "/candid-review --harsh" 2>&1 | tee /tmp/candid-review.txt && ! grep -q "🔥" /tmp/candid-review.txt'
        language: system
        pass_filenames: false
        stages: [commit]
        verbose: true
```

3. Install the hook:
```bash
pre-commit install
```

### Security-Only Review

For faster pre-commit, review only security:

```yaml
repos:
  - repo: local
    hooks:
      - id: candid-security
        name: Candid Security Review
        entry: bash -c 'claude code "/candid-review --harsh --focus security"'
        language: system
        pass_filenames: false
        stages: [commit]
```

## Option 3: Husky (JavaScript Projects)

For JavaScript projects using [Husky](https://typicode.github.io/husky/).

### Setup

1. Install Husky:
```bash
npm install husky --save-dev
npx husky init
```

2. Create `.husky/pre-commit`:
```bash
#!/bin/bash

echo "Running Candid code review..."

OUTPUT=$(claude code "/candid-review --harsh" 2>&1)

echo "$OUTPUT"

# Fail on critical issues
if echo "$OUTPUT" | grep -q "🔥"; then
    echo ""
    echo "❌ Critical issues found. Fix before committing."
    echo "   Bypass with: git commit --no-verify"
    exit 1
fi

echo "✅ Review passed"
```

3. Make it executable:
```bash
chmod +x .husky/pre-commit
```

### With lint-staged

Combine with [lint-staged](https://github.com/okonet/lint-staged) for staged-file-only reviews:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

Then in `.husky/pre-commit`:
```bash
#!/bin/bash

# Run linters on staged files
npx lint-staged

# Run Candid review
claude code "/candid-review --harsh"
```

## Option 4: Lefthook

For multi-language projects using [Lefthook](https://github.com/evilmartians/lefthook).

Create `lefthook.yml`:

```yaml
pre-commit:
  parallel: false
  commands:
    candid-review:
      run: |
        OUTPUT=$(claude code "/candid-review --harsh" 2>&1)
        echo "$OUTPUT"
        if echo "$OUTPUT" | grep -q "🔥"; then
          exit 1
        fi
```

Install:
```bash
lefthook install
```

## Best Practices

### 1. Keep Reviews Fast

Pre-commit should complete in under 30 seconds. To achieve this:

- Use `--focus security` for quick security checks
- Stage small, focused changes
- Exclude generated files in config

```json
// .candid/config.json
{
  "tone": "harsh",
  "exclude": ["*.generated.ts", "dist/*", "*.min.js"]
}
```

### 2. Only Block on Critical

Don't block commits for minor issues—it slows development. Reserve blocking for:

- 🔥 Critical (security holes, crashes)
- Optionally ⚠️ Major (if team agrees)

Let code smells and edge cases through; catch them in PR review.

### 3. Provide Escape Hatch

Always document how to bypass:
```
git commit --no-verify
```

Trust developers to use it responsibly for legitimate cases (WIP commits, urgent fixes).

### 4. Share the Hook

Git hooks aren't committed by default. Share them via:

- **Pre-commit framework**: `.pre-commit-config.yaml` is committed
- **Husky**: `.husky/` directory is committed
- **Manual script**: Add setup instructions to README

### 5. Use Project Config

Commit `.candid/config.json` so all team members use the same settings:

```json
{
  "tone": "harsh",
  "focus": "security",
  "exclude": ["*.generated.ts"]
}
```

## Troubleshooting

### Hook Not Running

Verify the hook is executable:
```bash
ls -la .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Review Takes Too Long

- Use `--focus security` for faster reviews
- Stage fewer files per commit
- Consider CI/CD review instead

### "No changes detected"

The hook runs on staged changes. Make sure files are staged:
```bash
git add <files>
git commit
```

### Want to Skip This Once

```bash
git commit --no-verify -m "WIP: quick save"
```

### Hook Errors on Windows

Use bash-compatible shell. In Git Bash or WSL:
```bash
git config core.hooksPath .husky
```

## Example Workflow

1. Make changes
2. Stage changes: `git add .`
3. Commit: `git commit -m "Add feature"`
4. Candid runs automatically
5. If 🔥 critical found → commit blocked, fix issues
6. If only minor issues → commit proceeds
7. Full review happens in CI/CD or PR

This gives fast local feedback without blocking your flow for small issues.
