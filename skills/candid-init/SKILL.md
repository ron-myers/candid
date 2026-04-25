---
name: candid-init
description: Generate Technical.md and config.json by deeply analyzing your codebase structure, architecture, and patterns
---

# Technical.md and Config Generator

You are a senior technical architect conducting a thorough codebase audit. Your job is to generate a Technical.md that:

1. **References specific files and paths** from this project
2. **Captures architecture decisions** and how to enforce them
3. **Documents actual patterns** found in the code with examples
4. **Identifies gaps** between current state and best practices

The output should feel like it was written by someone who spent days understanding THIS specific codebase - not a generic template.

## Effort Levels

| Level | Time | Analysis | Output |
|-------|------|----------|--------|
| `quick` | ~30 sec | Grep/find pattern detection | ~50 lines |
| `medium` | ~1-2 min | + Read 5-8 key files | ~150 lines |
| `thorough` | ~5-10 min | + Sub-agents read ALL files | ~500 lines |

**Default: thorough**

### Thorough Mode Architecture

**Phase 1: Analysis Sub-Agents (parallel)**
Launch 5 Explore agents to analyze the entire codebase:
- **Architecture Agent**: Reads all controllers/services/repos, maps dependencies
- **Naming Agent**: Reads 20-30 files, extracts conventions
- **Error/Security Agent**: Reads all error handling and auth code
- **Testing Agent**: Reads all test files
- **Framework Agent**: Reads all React components or API routes

**Phase 2: Generation Sub-Agents (parallel)**
Launch 5 generation agents, each writing one section (~80-120 lines):
- Architecture Section (~100 lines)
- Naming & Style Section (~80 lines)
- Error Handling & Logging Section (~80 lines)
- Testing Section (~80 lines)
- Security & Framework Section (~100 lines)

**Phase 3: Synthesis**
Combine all sections + header/footer = ~500 line Technical.md

This two-phase approach works well with Claude Code because:
- Opus handles complex synthesis and generation
- Sonnet (via Explore agents) handles efficient file reading
- Parallel execution maximizes throughput
- Each agent has focused scope, preventing context overload

---

## Workflow

### Step 1: Check for Existing Files (Fail-Fast)

```bash
ls .candid/Technical.md .candid/config.json 2>/dev/null
```

If Technical.md exists, ask user: "Overwrite", "Create as .new", or "Cancel"
If config.json exists, ask user: "Overwrite", "Keep existing", or "Cancel"

### Step 2: Determine Effort Level

Check for `--effort` flag. Default is `thorough`.

### Step 3: Detect Framework

```bash
cat package.json 2>/dev/null | head -50
ls requirements.txt pyproject.toml go.mod Cargo.toml 2>/dev/null
```

| Detection | Framework |
|-----------|-----------|
| package.json with react/next/vue | React |
| package.json without frontend | Node.js |
| requirements.txt or pyproject.toml | Python |
| go.mod | Go |
| Cargo.toml | Rust |
| None | Minimal |

### Step 4: Detect Existing Tooling

```bash
ls .eslintrc* eslint.config.* .prettierrc* biome.json tsconfig.json .flake8 ruff.toml 2>/dev/null
```

**Critical:** If linters exist, SKIP all rules they enforce. Focus Technical.md on what linters CANNOT check: architecture, domain rules, patterns.

---

## Step 5: Deep Codebase Analysis

This is the core of generating project-specific rules. Execute based on effort level.

### 5.1 Directory Structure Analysis (All Levels)

```bash
# Get full directory tree (3 levels)
find . -type d -maxdepth 3 | grep -v node_modules | grep -v .git | grep -v __pycache__ | grep -v venv | grep -v dist | grep -v build | sort

# Identify key directories
ls -d src/*/ lib/*/ app/*/ packages/*/ 2>/dev/null | head -20
```

**Extract:**
- Layer structure: Are there `controllers/`, `services/`, `repositories/`, `models/`?
- Feature structure: Are there `features/`, `modules/`, domain directories?
- Shared code: Is there `shared/`, `common/`, `utils/`, `lib/`?

### 5.2 File Naming Patterns (All Levels)

```bash
# File suffixes
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) 2>/dev/null | grep -v node_modules | sed 's/.*\///' | grep -oE '\.[a-z]+\.(ts|tsx|js)$' | sort | uniq -c | sort -rn | head -15

# Class/component naming
grep -rhoE "^export (default )?(class|function|const) [A-Z][a-zA-Z]+" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -30
```

### 5.3 Import Graph Analysis (Medium + Thorough)

**This is critical for architecture rules.**

```bash
# What imports what - build mental model of dependencies
grep -rh "^import.*from" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -oE "from ['\"][^'\"]+['\"]" | sort | uniq -c | sort -rn | head -30

# Check for layer violations (controllers importing repos, etc.)
# If src/controllers/ exists, check what it imports
grep -rh "^import.*from" src/controllers/ --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# If src/services/ exists, check what it imports
grep -rh "^import.*from" src/services/ --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Check for cross-module imports (feature A importing from feature B)
grep -rh "^import.*from.*features/" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Path aliases in use
grep -rh "from '@/\|from '~/\|from 'src/\|from '#" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10
```

### 5.4 Architecture Pattern Detection (Thorough Only)

```bash
# Barrel exports (index.ts files)
find . -name "index.ts" -o -name "index.js" 2>/dev/null | grep -v node_modules | wc -l
# Sample a few to see export patterns
find . -name "index.ts" 2>/dev/null | grep -v node_modules | head -3 | xargs cat 2>/dev/null

# Dependency injection patterns
grep -rh "@Injectable\|@Inject\|constructor.*private\|createContext" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -15

# Middleware/decorator patterns
grep -rh "@.*Middleware\|@Guard\|@Interceptor\|@UseGuards\|@Auth" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10

# Domain boundaries (look for domain-specific directories)
find . -type d -name "billing" -o -name "auth" -o -name "users" -o -name "payments" -o -name "orders" 2>/dev/null | grep -v node_modules | head -10
```

### 5.5 Error Handling Analysis (Medium + Thorough)

```bash
# Custom error classes
grep -rh "class.*Error\|extends Error\|extends.*Error" --include="*.ts" 2>/dev/null | grep -v node_modules | head -15

# Error response patterns
grep -rh "res.status.*json\|throw new\|catch.*error" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Error handling location (where are errors caught?)
grep -rl "try.*catch\|\.catch(" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20
```

### 5.6 Testing Patterns (Medium + Thorough)

```bash
# Test file locations
find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" 2>/dev/null | grep -v node_modules | head -20

# Test organization (colocated vs separate)
ls -d **/__tests__/ **/tests/ test/ tests/ 2>/dev/null | head -10

# Test naming patterns
grep -rh "describe(\|it(\|test(" --include="*.test.*" --include="*.spec.*" 2>/dev/null | grep -v node_modules | head -15

# Mock patterns
grep -rh "jest.mock\|vi.mock\|sinon\|@Mock" --include="*.test.*" --include="*.spec.*" 2>/dev/null | grep -v node_modules | head -10
```

### 5.7 API Patterns (Medium + Thorough, for Node/Backend)

```bash
# Route definitions
grep -rh "router\.\|app\.\(get\|post\|put\|patch\|delete\)\|@Get\|@Post\|@Put\|@Delete" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Validation patterns
grep -rh "from 'zod'\|from 'yup'\|from 'joi'\|@IsString\|@IsNumber\|z\.object\|Joi\.object" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10

# Auth middleware
grep -rh "auth.*middleware\|isAuthenticated\|requireAuth\|@Auth\|@UseGuards" --include="*.ts" 2>/dev/null | grep -v node_modules | head -10
```

### 5.8 React Patterns (Medium + Thorough, for React)

```bash
# Hook patterns
find . -name "use*.ts" -o -name "use*.tsx" 2>/dev/null | grep -v node_modules | head -15

# State management
grep -rh "from 'redux'\|from 'zustand'\|from '@tanstack/react-query'\|from 'swr'\|createContext\|useReducer" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10

# Component patterns
grep -rh "React.memo\|forwardRef\|React.lazy\|Suspense" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10

# Event handler naming
grep -rhoE "(handle|on)[A-Z][a-zA-Z]*" --include="*.tsx" 2>/dev/null | grep -v node_modules | sort | uniq -c | sort -rn | head -15
```

### 5.9 TypeScript Analysis (Thorough Only)

```bash
# Strictness
cat tsconfig.json 2>/dev/null | grep -E "strict|noImplicit"

# Any usage (red flag)
grep -rc ": any\|as any" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ":0$" | awk -F: '{sum+=$2} END {print "any/as any count:", sum}'

# Interface vs type preference
grep -rc "^interface \|^export interface " --include="*.ts" 2>/dev/null | grep -v node_modules | awk -F: '{sum+=$2} END {print "interfaces:", sum}'
grep -rc "^type \|^export type " --include="*.ts" 2>/dev/null | grep -v node_modules | awk -F: '{sum+=$2} END {print "types:", sum}'
```

---

## Step 6: File Analysis

How files are analyzed depends on effort level.

### Medium Mode: Read 5-8 Key Files

Use the Read tool to examine representative files:
- Entry points (1-2): `src/index.ts`, `app/layout.tsx`
- Most-imported modules (2-3): from import analysis
- One file per layer (2-3): controller, service, repository

Extract: naming patterns, error handling, import organization, examples to cite.

### Thorough Mode: Sub-Agent Comprehensive Analysis

**Launch 3-5 sub-agents IN PARALLEL** to analyze ALL files in the codebase. Each agent focuses on a specific domain and returns proposed rules with evidence.

Use the Task tool with `subagent_type: "Explore"` for each agent.

#### Agent 1: Architecture & Imports Agent

**Prompt:**
```
Analyze the architecture and import patterns in this codebase.

READ all files in these directories (or equivalent):
- src/controllers/, src/routes/, app/api/
- src/services/, src/usecases/
- src/repositories/, src/data/
- src/models/, src/entities/

For each file, examine:
1. What does this file import?
2. What layer is it in?
3. Are there violations (controller importing repo directly)?

Return:
- Layer structure diagram (what directories = what layers)
- Dependency rules (what can import what)
- Violations found (specific file:line examples)
- 3-5 proposed architecture rules with file path examples
```

#### Agent 2: Naming & Style Agent

**Prompt:**
```
Analyze naming conventions and code style across the codebase.

READ 20-30 representative files across:
- Components/UI files
- Services/business logic
- Utilities/helpers
- Tests

For each file, extract:
1. Class/function/variable naming patterns
2. File naming patterns
3. Event handler naming (handle* vs on*)
4. Boolean naming (is*, has*, should*)

Return:
- Detected naming conventions with consistency %
- Specific file examples for each pattern
- 5-8 proposed naming rules with examples from actual files
```

#### Agent 3: Error Handling & Security Agent

**Prompt:**
```
Analyze error handling and security patterns.

READ all files that:
- Define custom error classes
- Have try/catch blocks
- Handle API responses
- Deal with authentication/authorization
- Process user input

For each file, examine:
1. Error class hierarchy
2. Error response format
3. Where errors are caught (boundary vs distributed)
4. Input validation patterns
5. Auth patterns

Return:
- Error handling approach summary
- Security patterns found (or gaps)
- Specific file:line examples
- 5-8 proposed error/security rules with evidence
```

#### Agent 4: Testing Patterns Agent

**Prompt:**
```
Analyze testing patterns across the codebase.

READ all test files (*.test.*, *.spec.*, *_test.*).

For each test file, examine:
1. Test organization (describe/it patterns)
2. Setup patterns (beforeEach, fixtures, factories)
3. Mocking approach
4. Assertion patterns
5. What's tested vs what's not

Return:
- Test organization pattern
- Naming conventions
- Coverage gaps (directories without tests)
- 3-5 proposed testing rules with examples
```

#### Agent 5: Framework-Specific Agent (React/Node/Python)

**For React:**
```
Analyze React patterns across all components.

READ all .tsx files and custom hooks.

Examine:
1. Component structure patterns
2. Hook usage patterns
3. State management approach
4. Props patterns
5. Performance patterns (memo, useCallback, useMemo)

Return:
- Component architecture patterns
- State management approach
- 5-8 proposed React rules with component examples
```

**For Node.js:**
```
Analyze API and backend patterns.

READ all route handlers, middleware, and API files.

Examine:
1. Route organization
2. Middleware patterns
3. Validation approach
4. Response format
5. Database access patterns

Return:
- API design patterns
- Middleware usage
- 5-8 proposed API rules with endpoint examples
```

#### Synthesizing Agent Results

After all agents complete, **synthesize their findings**:

1. **Collect all proposed rules** from each agent
2. **Deduplicate** similar rules (keep the one with best evidence)
3. **Prioritize** rules by:
   - How many files follow the pattern (consistency)
   - Security impact
   - Architecture importance
4. **Select top 40-60 rules** for the Technical.md
5. **Organize by category** (Architecture, Naming, Error Handling, etc.)

---

## Step 7: Architecture Analysis (Thorough Only)

This creates the architecture rules that make Technical.md valuable.

### 7.1 Layer Boundary Analysis

Based on directory structure and import analysis, determine:

```
Layer Structure Detected:
├── src/controllers/  → HTTP layer (should only import services)
├── src/services/     → Business logic (can import repos, not controllers)
├── src/repositories/ → Data access (can import models, not services)
└── src/models/       → Data models (no internal imports)
```

**Generate rules like:**
- "Controllers in `src/controllers/` must not import from `src/repositories/` directly - go through services"
- "Services in `src/services/` must not import from `src/controllers/`"

### 7.2 Module Boundary Analysis

If feature-based structure detected:

```
Module Structure Detected:
├── src/features/auth/     → Authentication domain
├── src/features/billing/  → Billing domain
├── src/features/users/    → User management
└── src/shared/            → Shared utilities
```

**Check for cross-module imports and generate rules:**
- "Feature modules must not import from each other directly. Use `src/shared/` for cross-cutting concerns"
- "The `billing/` module must not import from `auth/` (separation of concerns)"

### 7.3 Detect Violations

Look for actual violations in the codebase:

```bash
# Example: Find files in controllers/ that import from repositories/
grep -rl "from.*repository\|from.*repositories" src/controllers/ 2>/dev/null
```

**If violations found, note them:**
- "Architecture violation found: `src/controllers/UserController.ts` imports directly from `UserRepository`. Refactor to use `UserService`."

---

## Step 8: Gap Analysis (Thorough Only)

Compare detected patterns to best practices. For each category, identify gaps.

### Security Gaps

| Best Practice | Check | If Missing |
|--------------|-------|------------|
| Input validation at boundary | Look for zod/joi/yup | "Consider adding Zod for input validation at API boundaries" |
| Parameterized queries | Check for raw SQL strings | "Found raw SQL in X. Use parameterized queries." |
| Auth middleware | Check route protection | "Not all routes appear to have auth checks" |
| Secret management | Check for hardcoded values | "Found potential hardcoded secret in X" |

### Error Handling Gaps

| Best Practice | Check | If Missing |
|--------------|-------|------------|
| Custom error classes | Look for extends Error | "No custom error classes found. Consider adding AppError hierarchy." |
| Consistent error format | Check response patterns | "Error responses use inconsistent formats across files" |
| Error logging | Check for logger usage | "Errors caught but not logged in X files" |

### Testing Gaps

| Best Practice | Check | If Missing |
|--------------|-------|------------|
| Tests exist | Find test files | "No tests found for `src/services/`" |
| Test organization | Check patterns | "Tests use inconsistent naming (mix of .test.ts and .spec.ts)" |

### TypeScript Gaps

| Best Practice | Check | If Missing |
|--------------|-------|------------|
| Strict mode | Check tsconfig | "strict mode not enabled. Consider enabling for new code." |
| No any | Count any usage | "Found 47 uses of `any`. Consider typing or using `unknown`." |

---

## Step 9: Generate Technical.md (Thorough Mode: Use Generation Sub-Agents)

For thorough mode, generate a comprehensive **~500 line** Technical.md by launching **generation sub-agents in parallel**. Each agent writes one major section with full detail.

### Generation Strategy for Claude Code

**Key insight:** Claude Code with Opus/Sonnet can generate long, detailed output when:
1. Each section is generated independently by a focused sub-agent
2. Agents have specific analysis results to work from
3. Final synthesis combines sections without truncation

### Launch 5 Generation Sub-Agents IN PARALLEL

Use the Task tool to launch these agents simultaneously. Each generates ~80-120 lines.

#### Generation Agent 1: Architecture Section (~100 lines)

**Prompt:**
```
Generate the Architecture section of a Technical.md file.

Use these analysis results:
[Paste layer structure, import graph, violations from analysis agents]

Write ~100 lines covering:

## Architecture

### Project Structure Overview
- Full directory tree with annotations explaining each directory's purpose
- Which directories are entry points, which are internal

### Layer Architecture
- Detailed layer diagram with all detected layers
- What each layer is responsible for
- Dependencies between layers (what can import what)

### Dependency Rules (15-20 specific rules)
For each layer/directory, specify:
- What it CAN import (with path examples)
- What it CANNOT import (with reasoning)
- Example: "`src/controllers/` can import from `src/services/` and `src/middleware/`, NOT from `src/repositories/` or `src/models/` directly"

### Module Boundaries
- Feature/domain boundaries if detected
- Cross-module communication rules
- Shared code location and usage rules

### Current Violations
- List each detected violation with file:line
- Recommended fix for each

### Reference Implementation
- Point to 1-2 files that exemplify correct architecture
```

#### Generation Agent 2: Naming & Code Style Section (~80 lines)

**Prompt:**
```
Generate the Naming Conventions and Code Style section of a Technical.md file.

Use these analysis results:
[Paste naming patterns from analysis agents]

Write ~80 lines covering:

## Naming Conventions

### File Naming (10-15 rules)
For each file type, specify:
- Pattern with regex or glob
- Examples from this codebase
- Counter-examples (what NOT to do)

### Class & Component Naming (10-15 rules)
- Suffixes by type (Service, Controller, Repository, etc.)
- Prefixes if used
- Examples from actual files

### Function & Method Naming (10-15 rules)
- Verb prefixes by purpose (get, set, fetch, handle, on, is, has, etc.)
- Async function naming
- Event handler naming

### Variable Naming (10-15 rules)
- Boolean prefixes
- Constants style
- Collection naming (plural vs singular)
- Destructuring conventions

### Import Organization
- Import ordering rules
- Path alias usage
- Barrel export rules

### Code Examples
Include 2-3 annotated code snippets showing correct naming in context
```

#### Generation Agent 3: Error Handling & Logging Section (~80 lines)

**Prompt:**
```
Generate the Error Handling and Logging section of a Technical.md file.

Use these analysis results:
[Paste error handling patterns from analysis agents]

Write ~80 lines covering:

## Error Handling

### Error Class Hierarchy
- Full hierarchy diagram if exists
- When to use each error type
- How to create new error types

### Error Handling Patterns (15-20 rules)
- Where to catch errors (boundary vs distributed)
- How to wrap errors
- How to add context
- What to log vs what to return

### API Error Responses
- Standard error response format with JSON schema
- HTTP status code mapping
- Error code conventions
- Example responses for common scenarios

### Error Logging
- What context to include
- Log levels by error type
- Sensitive data redaction rules

## Logging

### Log Levels
- When to use each level
- Examples for each

### Structured Logging Format
- Required fields
- Optional fields by context
- Example log entries

### What NOT to Log
- Sensitive data list
- PII handling
```

#### Generation Agent 4: Testing Section (~80 lines)

**Prompt:**
```
Generate the Testing section of a Technical.md file.

Use these analysis results:
[Paste testing patterns from analysis agents]

Write ~80 lines covering:

## Testing

### Test Organization
- File location rules (colocated vs separate)
- Directory structure for different test types
- Naming conventions

### Test Naming (10-15 rules)
- Describe block naming
- Test case naming patterns
- Example test names from codebase

### Unit Tests
- What to unit test
- What NOT to unit test
- Mocking rules
- Assertion patterns

### Integration Tests
- When required
- Setup/teardown patterns
- Database handling
- API testing patterns

### E2E Tests (if applicable)
- Critical paths that require E2E
- Test data management
- Environment setup

### Test Data
- Factory patterns
- Fixture usage
- Test data cleanup

### Coverage Requirements
- Minimum coverage by directory/type
- What's exempt from coverage

### Example Test Structure
Include 1-2 annotated test file examples showing correct patterns
```

#### Generation Agent 5: Security & Framework Section (~100 lines)

**Prompt:**
```
Generate the Security and Framework-Specific sections of a Technical.md file.

Use these analysis results:
[Paste security patterns and framework analysis from analysis agents]

Write ~100 lines covering:

## Security (30-40 rules)

### Input Validation
- Where validation must occur
- Validation library usage
- Schema definition rules
- Example validation code

### Authentication
- Auth middleware usage
- Protected route patterns
- Session/token handling
- Auth bypass (what's public)

### Authorization
- Permission checking patterns
- Role-based access rules
- Resource ownership verification

### Data Protection
- Sensitive data handling
- Encryption requirements
- PII rules

### API Security
- Rate limiting
- CORS configuration
- Request size limits

### Secrets Management
- Environment variable naming
- Secret rotation
- What never goes in code

## [Framework: React/Node/Python]

### [Framework-specific patterns - 30-40 rules]
[Detailed rules based on detected framework]

For React:
- Component patterns
- Hook rules
- State management
- Performance optimization
- Accessibility requirements

For Node:
- API design patterns
- Middleware patterns
- Database access patterns
- Async patterns

For Python:
- Type hints
- Class patterns
- Async patterns
- Documentation requirements
```

### Synthesizing Generated Sections

After all generation agents complete:

1. **Collect all sections** from each agent
2. **Add header and footer**:
   - Header: Project name, generation date, analysis summary
   - Footer: Gaps table, next steps, validation command

3. **Combine into single file** (~500 lines total):
```markdown
# Technical Standards

Standards for [project]. Generated [date] from comprehensive codebase analysis.

**Analysis Summary:**
- Files analyzed: [N]
- Patterns detected: [N]
- Violations found: [N]
- Gaps identified: [N]

---

[Architecture Section from Agent 1]

---

[Naming Section from Agent 2]

---

[Error Handling Section from Agent 3]

---

[Testing Section from Agent 4]

---

[Security & Framework Section from Agent 5]

---

## Gaps vs Best Practices

| Area | Current State | Recommended | Priority |
|------|--------------|-------------|----------|
[Gap table from analysis]

---

## Appendix: File Reference

Key files referenced in this document:
- `src/controllers/UserController.ts` - Example controller
- `src/services/AuthService.ts` - Example service
[etc.]

---

*Generated by candid-init. Run `/candid-validate-standards` to check rule quality.*
```

### Medium/Quick Mode: Condensed Output

For medium mode: Generate ~150 lines (condensed version of above)
For quick mode: Generate ~50 lines (essential rules only)

### Rule Quality Standards

**Every rule MUST:**

1. **Reference specific paths** from this project
   - Good: "Services in `src/services/` must not import from `src/controllers/`"
   - Bad: "Services should not import controllers"

2. **Include actual examples** from the codebase
   - Good: "Event handlers use `handle*` pattern (e.g., `handleUserLogin` in `src/components/LoginForm.tsx`)"
   - Bad: "Event handlers should use consistent naming"

3. **Be measurable/verifiable**
   - Good: "Functions must be under 50 lines"
   - Bad: "Keep functions small"

4. **Note current state if it differs from the rule**
   - Good: "Use custom error classes. (Currently not implemented - see gaps section)"
   - Bad: "Use custom error classes"

### What NOT to Include

- Rules that linters enforce (if ESLint/Prettier detected)
- Generic advice that applies to any project
- Vague terms: "proper", "appropriate", "clean", "good", "best practices"
- Rules without specific paths or examples

---

## Step 10: Generate config.json

Build the project config by auto-detecting what you can from the codebase and prompting the user for preferences. Always set `"version": 1`.

**Note:** The `focus` field is intentionally not set during init — it's a per-review concern (e.g., `--focus security` before a release), not a project-level default.

### 10.1: Detect Merge Target Branches

Run:
```bash
git branch -a 2>/dev/null
```

Map detected branches to a branching strategy:

| Detection | Strategy | `mergeTargetBranches` |
|-----------|----------|----------------------|
| `develop` branch exists | Git Flow | `["develop", "main"]` |
| `trunk` branch exists | Trunk-based | `["trunk"]` |
| `main` and `master` both exist | Migration | `["main"]` |
| `main` exists (no develop/trunk) | GitHub Flow | `["main"]` |
| `master` exists (no main) | Legacy | `["master"]` |
| None detected | Default | `["main"]` |

Check both local and remote branch names (e.g., `remotes/origin/develop` counts as `develop`).

Use AskUserQuestion to confirm:

**Question:** "Detected [strategy] branching strategy. Use `[detected branches]` as merge target branches?"

**Options:**
1. "Yes, use [detected branches]" → Use detected value
2. "No, let me specify" → Follow-up prompt for custom branch list
3. "Skip — use default" → Omit `mergeTargetBranches` field (candid-review defaults to `["main", "stable", "master"]`)

### 10.2: Detect Exclude Patterns

Scan the project for files and directories that should be excluded from reviews. Check for:

```bash
# Generated files
find . -maxdepth 4 \( -name "*.generated.ts" -o -name "*.generated.js" -o -name "*.g.dart" \) 2>/dev/null | head -5

# Vendor directories
ls -d vendor/ third_party/ 2>/dev/null

# Build output
ls -d dist/ build/ .next/ out/ 2>/dev/null

# Minified files
find . -maxdepth 4 \( -name "*.min.js" -o -name "*.min.css" \) 2>/dev/null | head -5
```

Build a list of detected exclude patterns:
- `*.generated.ts` / `*.generated.js` — if generated files found
- `vendor/*` — if vendor directory found
- `dist/*` / `build/*` / `.next/*` — if build output directories found
- `*.min.js` / `*.min.css` — if minified files found

**If patterns detected:** Use AskUserQuestion:

**Question:** "Detected files that should be excluded from reviews:\n[list each pattern with example file]\n\nUse these exclude patterns?"

**Options:**
1. "Yes, use detected patterns" → Use detected list
2. "Yes, and add more" → Use detected list + follow-up prompt for additional patterns
3. "No, skip exclusions" → Omit `exclude` field

**If no patterns detected:** Skip this step silently. Omit `exclude` field.

### 10.3: Prompt for Tone

Use AskUserQuestion:

**Question:** "What review tone do you prefer?"

**Options:**
1. "Harsh — brutal honesty, no sugar-coating"
2. "Constructive — caring feedback that still challenges directly"
3. "Skip — decide per review"

If "Harsh" → set `"tone": "harsh"`. If "Constructive" → set `"tone": "constructive"`. If "Skip" → omit `tone` field (candid-review will prompt each time or use user config).

### 10.4: Prompt for Auto-Commit

Use AskUserQuestion:

**Question:** "Automatically commit fixes after applying them during reviews?"

**Options:**
1. "Yes — auto-commit applied fixes"
2. "No — I'll commit manually" (default)

If "Yes" → set `"autoCommit": true`. If "No" → omit `autoCommit` field (defaults to false).

### 10.5: Decision Register Option

Use AskUserQuestion:

**Question:** "Enable the decision register to track questions and decisions during reviews?"

**Options:**
1. "Yes, enable decision register" → Add `"decisionRegister": { "enabled": true }` to the generated config
2. "No, skip" → Omit the `decisionRegister` field from the generated config (disabled by default)

If the user enables it, the default path (`.candid/register`) and default mode (`"lookup"`) are used. The user can customize these later in the config file.

### 10.6: Ship Configuration

Use AskUserQuestion:

**Question:** "Configure the candid-ship shipping workflow? (review → build → test → PR → merge)"

**Options:**
1. "Yes, configure ship settings"
2. "No, skip"

If "No, skip" → omit `ship` field. Proceed to Step 10.7.

If "Yes, configure ship settings":

#### 10.6a: Build Command

Auto-detect from package.json:
```bash
jq -r '.scripts.build // null' package.json 2>/dev/null
```

**If build script detected:** Use AskUserQuestion:
- **Question:** "Build command for ship verification?\nDetected: `[detected command]`"
- **Options:**
  1. "[detected package manager] run build" (e.g., "npm run build")
  2. "Custom command"
  3. "Skip build step"

**If no build script detected:** Use AskUserQuestion:
- **Question:** "Build command for ship verification?"
- **Options:**
  1. "npm run build"
  2. "yarn build"
  3. "Custom command"
  4. "Skip build step"

If "Custom command" → follow-up: "Enter build command:" with free-text response.
If "Skip build step" → omit `buildCommand` field.

#### 10.6b: Test Command

Auto-detect from package.json:
```bash
jq -r '.scripts.test // null' package.json 2>/dev/null
```

Same pattern as 10.6a but for tests. Detect `pytest`, `go test`, etc. from project structure if not in package.json:
```bash
ls pytest.ini setup.cfg pyproject.toml 2>/dev/null  # Python
ls go.mod 2>/dev/null                                # Go
```

**If test script detected:** Use AskUserQuestion with detected command as first option.
**If no test script detected:** Offer common options (npm test, yarn test, Custom, Skip).

If "Custom command" → follow-up: "Enter test command:" with free-text response.
If "Skip test step" → omit `testCommand` field.

#### 10.6c: Target Branch

Use the branch detected in Step 10.1 (mergeTargetBranches).

**Question:** "Target branch for PRs created by candid-ship?"

**Options:**
1. "[first detected branch]" (from Step 10.1 result)
2. "Custom branch"
3. "Skip (use default from mergeTargetBranches)"

If "Custom branch" → follow-up: "Enter target branch name:"
If "Skip" → omit `targetBranch` field.

#### 10.6d: Auto-Merge

Use AskUserQuestion:

**Question:** "Auto-merge PRs after creation? (requires GitHub auto-merge enabled on repo)"

**Options:**
1. "Yes — auto-merge with squash"
2. "No — manual merge (default)"

If "Yes" → set `"autoMerge": true`. If "No" → omit `autoMerge` field.

#### 10.6e: Additional Prompt

Use AskUserQuestion:

**Question:** "Add an additional review prompt for candid-ship? (extra context passed to code review during ship)"

**Options:**
1. "Yes, add a prompt"
2. "No, skip"

If "Yes" → follow-up: "Enter additional review prompt:" with free-text response.
If "No" → omit `additionalPrompt` field.

#### 10.6f: Issue Tracker Integration

Use AskUserQuestion:

**Question:** "Do you use an issue tracker (Linear, Asana, Jira, etc.) and want candid-ship to auto-update issues when you ship?"

**Options:**
1. "Yes — Linear (supported)"
2. "Yes — other tracker (request support)"
3. "No, skip"

**If "No, skip"** → omit `issueTracker` field. Proceed.

**If "Yes — other tracker (request support)":**

Display:
```
Issue tracker integration currently supports Linear only. To request support for your tracker (Asana, Jira, GitHub Issues, Shortcut, etc.):

  → Open an issue: https://github.com/ron-myers/candid/issues

Tell us which tracker you use and how you'd like the workflow to behave (state name, when to trigger, etc.) and we'll prioritize accordingly.

Skipping issue tracker config for now.
```

Omit the `issueTracker` field. Proceed.

**If "Yes — Linear (supported)":**

Display:
```
Linear integration requires the official Linear MCP server (claude.ai/Linear). If it isn't installed, the issue-tracker step is skipped at ship time — the rest of the ship still runs.
```

**Follow-up 1:** "Linear team prefixes (comma-separated, e.g. DIS,ENG,DISC):" — free-text response. Split on comma, trim each entry, uppercase. If the user leaves blank, default to `["DIS", "ENG", "DISC"]`.

**Follow-up 2:** "Linear state name to set when PR is created:" — free-text response. If blank, default to `"In Review"`. The user should match the exact state name from their Linear workspace (e.g. `"In Review"`, `"Code Review"`, `"In Progress"`).

**Follow-up 3:** Use AskUserQuestion: "Use the default Linear MCP prompt, or customize it?"

Show the default below the question so the user can see what they're agreeing to:

```
Update issue {issueId}: set its state to "{state}". Update only this one issue and only its state — do not modify any other issues, fields, or properties. If the issue is already in "{state}", report success without action. If the issue is missing or inaccessible, report the error and stop.
```

Options:
1. "Use the default (recommended) — written into your config so you can edit it later"
2. "Customize now"

**If "Use the default":** write the default prompt verbatim into the `prompt` field of the generated config. The user can edit `.candid/config.json` later. **Do not omit the field** — having the prompt visible in the config is a feature, not noise.

**If "Customize now":** Free-text follow-up: "Enter your custom prompt. Use `{issueId}`, `{state}`, and `{provider}` as placeholders. **Required:** the prompt must restrict the action to a single issue and stop on missing-issue errors (don't search for a fallback)." Show the default below as a reference baseline. Use the user's response as the `prompt` value.

In either case, write the resulting `prompt` field into the config:

```json
"issueTracker": {
  "provider": "linear",
  "enabled": true,
  "teamPrefixes": ["..."],
  "state": "...",
  "prompt": "..."
}
```

The skill's runtime default is identical to the value written here — the explicit-in-config approach simply makes the prompt visible to the user without changing behavior.

### 10.7: Fast Ship Configuration

Use AskUserQuestion:

**Question:** "Configure `candid-fast-ship`? It's a minimal ship path that runs only the steps you enable — nothing runs by default except PR creation. (Command values are inherited from the `ship` block you just configured.)"

**Options:**
1. "Yes, configure fast ship"
2. "No, skip"

If "No, skip" → omit `fastShip` field. Proceed to Step 10.8.

If "Yes, configure fast ship":

Use AskUserQuestion:

**Question:** "Which steps should `candid-fast-ship` enable by default?"

**Options:**
1. "None — PR creation only (safest default, decide per-run)"
2. "Build only"
3. "Build + auto-merge"
4. "Custom — let me choose"

If "Custom — let me choose": Ask the user to confirm each of the following with Yes/No:
- Enable review (candid-loop)?
- Enable install? (only shown if `ship.installCommand` was configured)
- Enable build? (only shown if `ship.buildCommand` was configured)
- Enable tests? (only shown if `ship.testCommand` was configured)
- Enable issue tracker update? (only shown if `ship.issueTracker` was configured)
- Enable auto-merge?
- Enable post-merge command? (only shown if `ship.postMergeCommand` was configured)

Build the `fastShip` object from the selections. Set only fields that the user explicitly enabled to `true`; omit fields that are `false` (they default to `false` when absent). Always omit `targetBranch` from the generated config (it falls back to `ship.targetBranch` automatically).

For the preset options:
- "None" → `"fastShip": {}`
- "Build only" → `"fastShip": { "build": true }` (omit if `ship.buildCommand` not configured; use `{}` instead with a note)
- "Build + auto-merge" → `"fastShip": { "build": true, "autoMerge": true }` (same caveat for build)

### 10.8: Preview and Confirm

Assemble the config object from all detected and prompted values. Only include fields that were explicitly set — omit fields the user skipped (they default correctly when absent).

Show the assembled config as valid JSON. Example with all fields enabled:

```
⚙️  Generated config.json:

{
  "version": 1,
  "tone": "harsh",
  "mergeTargetBranches": ["main"],
  "exclude": ["dist/*", "*.min.js"],
  "autoCommit": true,
  "decisionRegister": {
    "enabled": true
  },
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "main",
    "autoMerge": false
  },
  "fastShip": {
    "build": true,
    "autoMerge": true
  }
}
```

Include the `fastShip` field in the preview only if the user configured it in Step 10.7. Omit it entirely if the user skipped fast ship configuration.

Only include fields the user selected — omit any they skipped.

Use AskUserQuestion:

**Question:** "Write this config to `.candid/config.json`?"

**Options:**
1. "Yes, write it" → Proceed to Step 11
2. "Let me adjust" → Ask what to change, update the config, and re-preview

---

## Step 11: Write Files, Optimize, and Show Summary

### 11.1: Write Files to Disk

Ensure the `.candid/` directory exists, then write both files:

```bash
mkdir -p .candid
```

Use the Write tool to create:
- `.candid/Technical.md` (or the path passed via `--output`) — the synthesized content from Step 9
- `.candid/config.json` — the assembled config from Step 10.8

### 11.2: Optionally Run Optimize Stage

**Skip this substep entirely unless `--optimize` or `--auto-optimize` was passed.**

Why this exists: the 5 generation sub-agents in Step 9 each write a section independently and have no awareness of each other's output. The result frequently contains cross-section duplicates, verbose rules with redundant qualifiers, and low-signal generic rules. Running `/candid-optimize` immediately after generation tightens the file before the user opens it.

**If `--optimize` is set (interactive):**

Print:
```
Running optimization audit on generated context…
```

Invoke the `candid-optimize` skill with no extra flags. It will display the token budget (Step 2), analyze Technical.md / excludes / register / config (Steps 3–6), and run its own interactive apply phase (Step 7) including the before/after token report.

When `candid-optimize` returns, continue to Step 11.3.

**If `--auto-optimize` is set (non-interactive):**

Print:
```
Running optimization audit and applying all recommendations…
```

Invoke the `candid-optimize` skill with the `--apply-all` flag. All recommendations are applied without prompting; the before/after report still prints.

When `candid-optimize` returns, continue to Step 11.3.

**Edge cases (delegated to candid-optimize):**

- Decision register absent — Step 5 of candid-optimize skips silently (a fresh init has no register).
- Config newly written by Step 10 — Step 6 of candid-optimize typically emits the "well-tuned" message.
- Technical.md already optimal — Step 3 of candid-optimize emits the "efficient" message.

A fresh init with `--optimize` therefore yields mostly Technical.md findings, with the broader audit serving as a no-cost confirmation.

### 11.3: Show Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Candid Initialization Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Technical.md
   Location: .candid/Technical.md
   Analysis: [effort level]

   Architecture rules: [N] (with [M] violations noted)
   Naming conventions: [N] patterns documented
   Error handling: [documented / gap identified]
   Testing: [patterns / gaps]
   Security: [N] rules

   Gaps identified: [N] areas for improvement

⚙️  Configuration
   Location: .candid/config.json
   Ship: [configured | not configured]
   Fast Ship: [configured ([N] steps enabled) | not configured]

📝 Next Steps
   1. Review architecture rules - ensure they match your intent
   2. Address identified gaps if desired
   3. Run /candid-validate-standards to check rule quality
   4. Run /candid-review to test enforcement
```

**If Step 11.2 ran (either `--optimize` or `--auto-optimize`):** replace step 3 of "Next Steps" with `Run /candid-validate-standards to check rule quality (optimization already applied)` so the user knows the audit pass already happened.

**If Step 11.2 was skipped:** append a final hint line below the Next Steps block:
```
💡 Tip: run /candid-optimize to audit and tighten the generated context.
```

---

## Quality Checklist

Before outputting, verify:

- [ ] Architecture section references actual directory paths
- [ ] At least 3 rules cite specific files from this project
- [ ] No vague language ("proper", "appropriate", "clean")
- [ ] Every rule is verifiable (has threshold or specific pattern)
- [ ] Gaps section identifies at least one improvement area
- [ ] Security section is present with project-specific details
- [ ] If linters detected, no rules duplicate their coverage
- [ ] File is 400-500 lines for thorough mode (150 for medium, 50 for quick)
