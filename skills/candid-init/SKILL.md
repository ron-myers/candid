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

Thorough mode runs 5 parallel analysis sub-agents (Step 6), then 5 parallel generation sub-agents (Step 9), then synthesis.

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

# For each layer dir (controllers, services, ...), check what it imports — flags layer violations:
grep -rh "^import.*from" src/controllers/ --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Check for cross-module imports (feature A importing from feature B)
grep -rh "^import.*from.*features/" --include="*.ts" 2>/dev/null | grep -v node_modules | head -20

# Path aliases in use
grep -rh "from '@/\|from '~/\|from 'src/\|from '#" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | head -10
```

### 5.4 Architecture Pattern Detection (Thorough Only)

Detect barrel exports (index.ts count + samples), dependency injection, middleware/decorator patterns, and domain-specific directories — commands in reference/analysis-commands.md.

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

Detect route definitions, validation patterns (zod/yup/joi/decorators), and auth middleware — commands in reference/analysis-commands.md.

### 5.8 React Patterns (Medium + Thorough, for React)

Detect custom hooks, state management libraries, component patterns (memo/forwardRef/lazy/Suspense), and event handler naming — commands in reference/analysis-commands.md.

### 5.9 TypeScript Analysis (Thorough Only)

Detect tsconfig strictness, `any`/`as any` usage counts, and interface-vs-type preference — commands in reference/analysis-commands.md.

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

Launch 5 Explore sub-agents IN PARALLEL (Task tool, subagent_type: "Explore"). Read reference/analysis-prompts.md (relative to this skill) for the exact prompt for each:

1. Architecture & Imports
2. Naming & Style
3. Error Handling & Security
4. Testing Patterns
5. Framework-Specific (React or Node variant)

Each returns proposed rules with file:line evidence.

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

If feature-based structure detected (e.g., `src/features/auth/`, `src/features/billing/`, `src/shared/`), generate cross-module rules the same way, e.g. "Feature modules must not import from each other directly — use `src/shared/` for cross-cutting concerns."

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

| Category | Best Practice | Check | If Missing |
|----------|--------------|-------|------------|
| Security | Input validation at boundary | Look for zod/joi/yup | "Consider adding Zod for input validation at API boundaries" |
| Security | Parameterized queries | Check for raw SQL strings | "Found raw SQL in X. Use parameterized queries." |
| Security | Auth middleware | Check route protection | "Not all routes appear to have auth checks" |
| Security | Secret management | Check for hardcoded values | "Found potential hardcoded secret in X" |
| Error Handling | Custom error classes | Look for extends Error | "No custom error classes found. Consider adding AppError hierarchy." |
| Error Handling | Consistent error format | Check response patterns | "Error responses use inconsistent formats across files" |
| Error Handling | Error logging | Check for logger usage | "Errors caught but not logged in X files" |
| Testing | Tests exist | Find test files | "No tests found for `src/services/`" |
| Testing | Test organization | Check patterns | "Tests use inconsistent naming (mix of .test.ts and .spec.ts)" |
| TypeScript | Strict mode | Check tsconfig | "strict mode not enabled. Consider enabling for new code." |
| TypeScript | No any | Count any usage | "Found 47 uses of `any`. Consider typing or using `unknown`." |

---

## Step 9: Generate Technical.md (Thorough Mode: Use Generation Sub-Agents)

For thorough mode, generate a comprehensive **~500 line** Technical.md by launching **generation sub-agents in parallel**. Each agent writes one major section with full detail.

### Generation Strategy for Claude Code

Each section is generated independently by a focused sub-agent working from specific analysis results, and the final synthesis combines sections without truncation — this lets Claude Code produce long, detailed output. Launch the agents simultaneously.

| Agent | Section | ~Lines |
|-------|---------|--------|
| 1 | Architecture | ~100 |
| 2 | Naming & Style | ~80 |
| 3 | Error Handling & Logging | ~80 |
| 4 | Testing | ~80 |
| 5 | Security & Framework | ~100 |

Read reference/generation-prompts.md (relative to this skill) and launch all 5 agents in parallel via Task, pasting the relevant analysis results into each prompt where indicated.

### Synthesizing Generated Sections

After all generation agents complete, collect all sections and combine into one ~500-line file in this order: (1) header — title, "Standards for [project]. Generated [date] from comprehensive codebase analysis." plus Analysis Summary bullets (files analyzed, patterns detected, violations found, gaps identified); (2) the five agent sections separated by `---`; (3) Gaps vs Best Practices table (Area | Current State | Recommended | Priority); (4) Appendix: File Reference listing key cited files; (5) footer line: *Generated by candid-init. Run `/candid-validate-standards` to check rule quality.*

### Medium/Quick Mode: Condensed Output

For medium mode: Generate ~150 lines (condensed version of above)
For quick mode: Generate ~50 lines (essential rules only)

Tag each rule `[observed N/M]` (count via grep) or `[recommended]`, with known exceptions listed.

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

5. **Tag provenance and adherence**
   - `[observed 12/14]` — convention followed by 12 of 14 relevant files. List the 2
     violating files as `Known exceptions: path1, path2` so reviews flag only NEW violations,
     not pre-existing code.
   - `[recommended]` — best practice not yet present in this codebase. Must also appear in
     the Gaps table; reviews should surface these as suggestions, never as hard violations.
   - A rule with adherence below 60% must not ship as `[observed]` — move it to Gaps.

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

### 11.3: Show Summary

Print a summary with: Technical.md location + effort level; counts of architecture rules (and violations), naming patterns, error handling/testing/security status, gaps identified; config.json location with ship / fastShip configured-or-not; Next Steps 1-4 (review rules, address gaps, run /candid-validate-standards, run /candid-review).

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
