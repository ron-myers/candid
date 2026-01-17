---
name: candid-init
description: Generate a Technical.md file by analyzing your codebase structure, detecting frameworks, and creating appropriate standards
---

# Technical.md Generator

You are a technical standards architect. Your job is to analyze a codebase and generate an appropriate Technical.md file that will be used by candid-review to enforce project standards.

## Workflow

### Step 1: Check for Existing Technical.md (Fail-Fast)

Before any analysis, check if Technical.md already exists to get user consent early:

```bash
ls ./Technical.md ./.claude/Technical.md 2>/dev/null
```

**If file exists:**
- **Question:** "Technical.md already exists. What would you like to do?"
- **Options:**
  1. "Overwrite existing file" → Continue to Step 2
  2. "Create as Technical.md.new for comparison" → Continue to Step 2, set output to `.new`
  3. "Cancel" → Stop workflow, inform user no changes made

**If no file exists:** Continue to Step 2.

### Step 2: Determine Target Framework

Check if a framework was specified via CLI argument:
- `react` → Use React/frontend template as base
- `node` → Use Node.js/backend template as base
- `python` → Generate Python-specific standards
- `minimal` → Use minimal template (framework-agnostic)
- No argument → Auto-detect (Step 3)

If framework specified, skip to Step 4 with that framework.

### Step 3: Auto-Detect Framework (if not specified)

Analyze the codebase to determine the primary framework:

```bash
# Check for package.json (Node/JS project)
cat package.json 2>/dev/null | head -50

# Check for requirements.txt or pyproject.toml (Python)
ls requirements.txt pyproject.toml 2>/dev/null

# Check for go.mod (Go)
ls go.mod 2>/dev/null

# Check for Cargo.toml (Rust)
ls Cargo.toml 2>/dev/null
```

**Detection rules:**

| Files Found | Framework |
|-------------|-----------|
| `package.json` with react/next/vue | React/Frontend |
| `package.json` without frontend framework | Node.js/Backend |
| `requirements.txt` or `pyproject.toml` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| None of the above | Minimal |

Output: `Detected framework: [framework]`

### Step 4: Check for Existing Standards

Look for existing configuration that indicates project standards:

```bash
# Linter configs
ls .eslintrc* eslint.config.* .prettierrc* 2>/dev/null

# TypeScript config
ls tsconfig.json 2>/dev/null

# Python linter configs
ls .flake8 pyproject.toml setup.cfg 2>/dev/null | head -5
```

If linter configs exist, note them. The generated Technical.md should NOT duplicate rules that linters already enforce.

Output: `Found existing configs: [list]`

### Step 5: Analyze Project Structure

Understand the codebase organization:

```bash
# Get directory structure (top 2 levels)
find . -type d -maxdepth 2 | grep -v node_modules | grep -v .git | grep -v __pycache__ | head -30

# Count files by type
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | wc -l
find . -name "*.py" | wc -l
find . -name "*.go" | wc -l
```

Note patterns:
- Is there a clear separation (src/, lib/, tests/)?
- Are there API routes or controllers?
- Is there a database layer?
- Are there tests?

### Step 6: Generate Technical.md

Based on gathered information, generate a Technical.md file.

**Structure:**

```markdown
# Technical Standards

[Brief description of what this file is for]

---

## [Category 1]

- [Rule 1]
- [Rule 2]

---

## [Category 2]

- [Rule 3]
- [Rule 4]

---
```

**Guidelines for generated rules:**

1. **Be specific, not vague**
   - Good: "Functions must be under 50 lines"
   - Bad: "Keep functions small"

2. **Don't duplicate linter rules**
   - If ESLint/Prettier/Flake8 exists, don't include style rules
   - Focus on architectural and semantic rules

3. **Include security rules always**
   - Input validation
   - No secrets in code
   - Parameterized queries

4. **Match project structure**
   - If there's a clear layers pattern, document it
   - If there's a naming convention visible, codify it

5. **Keep it short**
   - Target 50-100 lines of actual rules
   - Quality over quantity

**Category suggestions by framework:**

| Framework | Categories |
|-----------|-----------|
| React | Components, Hooks, State, Performance, Accessibility |
| Node.js | API Design, Error Handling, Database, Security |
| Python | Type Hints, Error Handling, Testing, Documentation |
| Minimal | Security, Error Handling, Code Quality, Testing, Git |

### Step 7: Write the File

Determine output path from:
1. CLI `--output` flag if provided
2. User choice from Step 1 (if `.new` was selected)
3. Default: `./Technical.md`

Use the Write tool to create the Technical.md file at the determined path.

After writing, output:
```
✅ Created Technical.md with [N] rules across [M] categories.

Categories:
- [Category 1] ([X] rules)
- [Category 2] ([Y] rules)
...

Next steps:
1. Review the generated standards
2. Remove any rules that don't apply to your project
3. Add any project-specific rules
4. Run /candid-review to see it in action
```

## Templates Reference

The generated content should be based on these templates but customized for the detected project:

- **React:** See templates/Technical-react.md
- **Minimal:** See templates/Technical-minimal.md
- **Node.js:** Similar to minimal but with API/database focus
- **Python:** Type hints, docstrings, testing patterns

## Remember

The goal is a Technical.md that:
1. The developer will actually read (keep it short)
2. Catches real issues (specific, verifiable rules)
3. Doesn't duplicate tooling (no style rules if linters exist)
4. Fits the project (based on actual structure, not generic advice)

A good Technical.md is one that improves code quality without adding friction.
