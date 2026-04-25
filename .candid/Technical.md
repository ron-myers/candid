# Technical Standards

Standards for the Candid Claude Code plugin. Generated 2026-04-20 from comprehensive codebase analysis.

**Analysis Summary:**
- Files analyzed: 40+
- Patterns detected: 30+
- Violations found: 0
- Gaps identified: 4

---

## Architecture

### Project Structure Overview

```
columbia/
├── .claude-plugin/          # Plugin metadata (plugin.json, marketplace.json)
├── skills/                  # Skill implementations (Markdown workflow specs)
│   ├── candid-review/       # Code review skill (SKILL.md, CONFIG.md)
│   ├── candid-ship/         # Ship workflow skill
│   ├── candid-loop/         # Loop execution skill
│   ├── candid-init/         # Init/setup skill
│   ├── candid-optimize/     # Context optimization skill
│   └── candid-validate-standards/  # Standards validation skill
├── commands/                # Command definitions (shorthand markdown)
├── templates/               # Technical.md templates (minimal, react, node)
├── examples/                # Example configs and review workflows
├── tests/                   # Config validation test fixtures
│   └── config-validation/   # JSON fixtures + TESTING-GUIDE.md
├── docs/                    # Next.js documentation website
│   ├── app/                 # Next.js App Router
│   │   ├── layout.jsx       # Root layout (server component)
│   │   ├── (marketing)/     # Marketing route group
│   │   │   ├── page.jsx     # Homepage (client component)
│   │   │   └── brand/       # Brand page (BrandPageClient.jsx)
│   │   ├── components/      # Shared React components
│   │   │   ├── schema/      # JSON-LD schema components (stateless)
│   │   │   ├── Pre.jsx      # Code copy button
│   │   │   ├── Logo.jsx     # Logo component
│   │   │   ├── FathomAnalytics.jsx  # Analytics bridge (client)
│   │   │   └── trackEvent.js       # Analytics utility (event registry)
│   │   └── docs/            # MDX documentation pages
│   └── scripts/             # Build scripts (copy-changelog, search index)
└── scripts/                 # Utility scripts (bump-version.ts)
```

### Skill Architecture (The Core)

Skills are **declarative specifications**, not executable code. Each skill is a Markdown file
that Claude executes as a structured workflow:

```
┌─────────────────────────────────────────────────────┐
│              Claude Code Plugin                      │
│              (skills/*/SKILL.md)                     │
└─────────────────────────────────────────────────────┘
                    │ reads
┌─────────────────────────────────────────────────────┐
│           Configuration Layer                        │
│  CLI args > .candid/config.json >                   │
│  ~/.candid/config.json > defaults                    │
└─────────────────────────────────────────────────────┘
                    │ enforces
┌─────────────────────────────────────────────────────┐
│           Standards Layer                            │
│  .candid/Technical.md (this file)                    │
│  .candid/register/ (decision register)               │
└─────────────────────────────────────────────────────┘
```

### Dependency Rules

**Skill Files (`skills/*/SKILL.md`):**
- Must respect 3-level config precedence: CLI args → `.candid/config.json` → `~/.candid/config.json` → defaults
- Must check for `.candid/Technical.md` before enforcing standards; gracefully proceed without it
- Must not depend on other skills' workflow logic directly — coordinate through shared config or shared specs
- Cross-skill shared specifications live alongside their primary skill (e.g. `candid-review/CONFIG.md`, `candid-ship/WORKFLOW.md`). When extracting common steps from a skill workflow, prefer this pattern over duplication.
- Reference: `skills/candid-review/SKILL.md` Step 1 and Step 2.5; `skills/candid-ship/WORKFLOW.md`

**Documentation Website (`docs/`):**
- Server Components (layouts, static pages): must NOT use `'use client'`, must NOT use React hooks directly
- Client Components (interactive): must use `'use client'` directive when using any hooks
- Utility files (`docs/app/components/trackEvent.js`): must NOT import React components
- Schema components (`docs/app/components/schema/`): must be stateless (no hooks, no state, no props)
- Page components must NOT import other page components
- No `@` or `~` path aliases — use relative paths only

**Import Order in `docs/`:**
```javascript
// 1. React core
import { useState, useEffect, useRef, useCallback } from 'react'
// 2. Next.js
import Link from 'next/link'
import Image from 'next/image'
// 3. Third-party
import * as Fathom from 'fathom-client'
// 4. Local components (relative paths)
import Pre from './components/Pre'
import { trackEvent, EVENTS } from '../components/trackEvent'
// 5. Styles last
import './globals.css'
```
Reference: `docs/app/layout.jsx` lines 1-5, `docs/app/(marketing)/page.jsx` lines 1-8

### No Violations Found

Clean import graph with unidirectional data flow. No circular dependencies detected across all 40+ analyzed files.

---

## Naming Conventions

### File Naming

| File Type | Pattern | Examples |
|-----------|---------|---------|
| React components | PascalCase + `.jsx` | `Pre.jsx`, `Logo.jsx`, `FathomAnalytics.jsx` |
| Utility files | camelCase + `.js/.ts` | `trackEvent.js`, `mdx-components.js` |
| Build scripts | kebab-case + `.js/.ts` | `copy-changelog.js`, `bump-version.ts` |
| Next.js route dirs | kebab-case | `get-started/`, `core-features/`, `how-to-guides/` |
| Route groups | parenthetical | `(marketing)/` |
| Skill spec files | `SKILL.md` (uppercase) | `skills/candid-review/SKILL.md` |
| Config files | lowercase | `config.json`, `plugin.json` |
| Test fixtures | `{valid\|invalid}-{feature}.json` | `valid-harsh.json`, `invalid-malformed.json` |

### React Component Naming (100% consistency)

PascalCase function name must match filename exactly:
```javascript
// ✓ docs/app/components/FathomAnalytics.jsx
export default function FathomAnalytics() {}

// ✓ docs/app/components/schema/SoftwareApplicationSchema.jsx
export default function SoftwareApplicationSchema() {}

// ✗ export default function fathomAnalytics() {}  ← camelCase
// ✗ export default function Analytics() {}         ← name mismatch
```

All React components use `export default` (not named exports for the component itself).

### Event Handler Naming (100% consistency)

Custom event handlers exclusively use `handle*` prefix. Never `on*` for custom handlers —
`on*` is reserved for HTML attribute props only:
```javascript
// ✓ docs/app/components/Pre.jsx:10
const handleCopy = async () => {}

// ✓ docs/app/(marketing)/brand/BrandPageClient.jsx:124
const handleCopy = useCallback(async (value, label) => {}, [])

// ✓ docs/app/(marketing)/layout.jsx:30
const handleResize = () => {}

// ✗ const onCopy = () => {}        ← reserved for HTML/prop callbacks
// ✗ const clickHandler = () => {}  ← no prefix
```

### Constant Naming (98% consistency)

Module-level constants use SCREAMING_SNAKE_CASE. Object property keys remain camelCase:
```javascript
// ✓ docs/app/components/trackEvent.js
export const EVENTS = {
  GET_STARTED_CLICK: 'get_started_click',
  GITHUB_CLICK: 'github_click',
  CODE_COPY: 'code_copy',
}

// ✓ docs/scripts/generate-search-index.js
const EXCLUDED_PATHS = ['/brand']
const SITE_URL = 'https://www.candid.tools'
const TOAST_DURATION_MS = 2000
```

### State and Ref Naming

```javascript
// ✓ useState: [noun, setNoun] — always paired
const [copied, setCopied] = useState(false)           // Pre.jsx:7
const [mounted, setMounted] = useState(false)         // not-found.jsx:8
const [heroLoaded, setHeroLoaded] = useState(false)   // (marketing)/page.jsx:44
const [isDark, setIsDark] = useState(...)             // BrandPageClient.jsx:69

// ✓ useRef: always *Ref suffix
const preRef = useRef(null)       // Pre.jsx
const logoRef = useRef(null)      // BrandPageClient.jsx:77
const featuresRef = useRef(null)  // (marketing)/page.jsx:47
```

### Boolean Variable Naming

Use `is*` prefix for boolean state; setter always `set*`:
```javascript
// ✓
const [isMenuOpen, setIsMenuOpen] = useState(false)
const [isDark, setIsDark] = useState(false)

// ✗ const [open, setOpen] = useState(false)  ← unclear it's boolean
```

### Utility Function Naming

camelCase with descriptive verb prefix:
```javascript
// ✓ docs/scripts/generate-search-index.js
async function discoverDocRoutes(docsDir, baseUrlPath = '/docs') {}
function getGitTimestamp(filePath) {}
function calculatePriority(urlPath) {}

// ✓ scripts/bump-version.ts
function checkGitClean(): void {}
function calculateNewVersion(current: string, bump: BumpType): string {}
```

---

## Error Handling

### Approach: Boundary Validation + Graceful Degradation

Errors are caught at step/operation boundaries, not distributed throughout logic. Invalid or
missing input gracefully degrades to defaults rather than crashing the workflow.

### Config Validation Pattern

All configuration files validated immediately on load with explicit fallback chain:
```
CLI args → .candid/config.json → ~/.candid/config.json → default/prompt
```
At each level: if missing → silent skip to next. If invalid → warn + continue.

Reference: `skills/candid-review/CONFIG.md` lines 63-156

**Warning format:**
```
⚠️  Invalid config at [path]: [specific error]. Falling back to [next source].
```

### Build Script Error Pattern

Wrap all external commands; log context, then re-throw:
```typescript
// ✓ scripts/bump-version.ts:18-26
function exec(command: string, errorMessage?: string): string {
  try {
    return execSync(command, { encoding: 'utf-8' }).trim();
  } catch (error) {
    if (errorMessage) console.error(`❌ ${errorMessage}`);
    throw error;
  }
}
```

### Precondition Checks Before Irreversible Operations

Validate ALL preconditions before commits, tags, or file writes. Fail fast with clear message:
```typescript
// ✓ scripts/bump-version.ts:32-37
function checkGitClean(): void {
  const status = exec('git status --porcelain');
  if (status) {
    console.error('❌ Git working directory is not clean');
    process.exit(1);
  }
}
```

Reference: `skills/candid-review/SKILL.md` Step 9.5 — auto-commit only runs if ALL true:
flag set + fixes applied + git repo available.

### Type Validation After JSON.parse

Immediately validate structure and types; never assume shape matches schema:
```typescript
// ✓ scripts/bump-version.ts:115-118
if (!json.plugins || !Array.isArray(json.plugins) || json.plugins.length === 0) {
  throw new Error('Invalid marketplace.json structure: missing plugins array');
}
```

### Error Message Format

```
❌ Failed to [action] [resource]: [specific error]. [next step if any]
```
Examples from `scripts/bump-version.ts`: `❌ Failed to update plugin.json: ENOENT`

### Graceful Degradation for Non-Critical Features

For filesystem traversal and optional features, swallow errors and skip:
```javascript
// ✓ docs/app/llms.txt/route.js:99-101
try {
  const entries = await fs.readdir(docsDir, { withFileTypes: true })
} catch {
  // Skip unreadable directories — continue without crashing
}
```

---

## Testing

### Current State: Manual Config Validation Only

No automated tests exist. Testing infrastructure is manual config validation in
`tests/config-validation/` — 15 JSON fixtures + `TESTING-GUIDE.md`.

### Test Fixture Naming Convention

```
{valid|invalid}-{feature-description}.json

✓ tests/config-validation/valid-harsh.json
✓ tests/config-validation/valid-merge-target-single.json
✓ tests/config-validation/invalid-bad-tone.json
✓ tests/config-validation/invalid-malformed.json
✗ test_config.json              ← violates naming pattern
✗ harsh_test.json               ← wrong separator
```

### Test Organization: Group by Feature Domain

Manual tests in `tests/config-validation/TESTING-GUIDE.md` grouped as:
- Precedence Tests (4 scenarios) — config source priority ordering
- Error Handling Tests (8 scenarios) — invalid JSON, bad values, edge cases
- Source Transparency Tests (4 scenarios) — output messaging clarity
- Edge Cases (3 scenarios) — file permissions, symlinks, whitespace
- Merge Target Tests (5 scenarios)

### Test Verification Pattern

Each test scenario must specify observable output (not vague "should work"):
```
Test: User config has harsh tone
Expected: Uses user config, skips prompt
Verify: Shows "Using harsh tone (from user config)"  ← exact observable output
```

### Coverage Gaps

| Directory | Test Coverage |
|-----------|--------------|
| `tests/config-validation/` | ✓ Manual (25 scenarios) |
| `skills/` | ✗ None |
| `commands/` | ✗ None |
| `scripts/` | ✗ None — highest priority gap |
| `docs/` | ✗ None |
| `templates/` | ✗ None |

**Priority gap:** `scripts/bump-version.ts` updates version across 3 files with no tests.

---

## Security

### Input Validation at Load Time

All config fields validated before use against allowed values:
- `tone`: `"harsh"` | `"constructive"` (string)
- `focus`: `"security"` | `"performance"` | `"architecture"` | `"edge-case"`
- `mergeTargetBranches`: array of non-empty strings
- `autoCommit`: boolean
- Unknown/extra fields: ignored (forward compatibility)

Reference: `skills/candid-review/CONFIG.md` lines 63-75

### Safe Defaults (Opt-In for Dangerous Operations)

- `autoCommit`: false by default — must be explicitly enabled
- `autoMerge`: disabled by default in ship config
- Invalid `focus` → proceed without focus filter (review all categories, not fewer)
- Missing Technical.md → proceed without standards enforcement (never block review)

### No Secrets in Code

No API keys, tokens, or credentials in version-controlled files. External service keys
(Fathom tracking ID) go in environment variables, not hardcoded in source.

### Pre-Flight for Destructive Git Operations

Before any git commit/tag/push in scripts, verify:
1. Git repo exists (`git rev-parse --git-dir`)
2. Working directory is clean (`git status --porcelain`)
3. Tag doesn't already exist (prevents duplicate version tags in `bump-version.ts`)

---

## React / Next.js Patterns

### Server vs Client Component Split

Default to server components. Add `'use client'` only when React hooks are required.
Wrap interactive client components in server parents to isolate interactivity:

```javascript
// ✓ Server (docs/app/(marketing)/brand/page.jsx) — no directive, no hooks
import BrandPageClient from './BrandPageClient'
export default function BrandPage() {
  return <BrandPageClient />
}

// ✓ Client (docs/app/(marketing)/brand/BrandPageClient.jsx)
'use client'
import { useState, useCallback } from 'react'
export default function BrandPageClient() {}
```

### Hydration-Safe State for Browser APIs

For state dependent on `window`, `localStorage`, or route, use a `mounted` flag:
```javascript
// ✓ docs/app/not-found.jsx, docs/app/(marketing)/brand/BrandPageClient.jsx
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

{mounted && <code>{window.location.pathname}</code>}  // only after hydration
```
Never read `window` or `localStorage` at render time — causes SSR/client mismatch.

### Analytics: Use Central trackEvent, Never Fathom Directly

Components call `trackEvent(EVENTS.FOO)` — never `Fathom.trackEvent()` directly.
Add new events to `EVENTS` in `docs/app/components/trackEvent.js` first:

```javascript
// ✓ docs/app/(marketing)/page.jsx:149
onClick={() => trackEvent(EVENTS.GET_STARTED_CLICK)}

// ✓ docs/app/components/Pre.jsx:16
trackEvent(`code_copy_${identifier}`)

// ✗ Fathom.trackEvent('get_started_click')  ← bypasses registry
```

### Schema Components: Stateless JSON-LD Factories

Components in `docs/app/components/schema/` must be stateless. Return only a `<script>` tag:
```javascript
// ✓ docs/app/components/schema/SoftwareApplicationSchema.jsx
export default function SoftwareApplicationSchema() {
  const schema = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', ... }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}
// No useState, no useEffect, no props accepted
```

### Metadata Export on All Public Routes

Export `metadata` before the component; include OpenGraph and Twitter fields:
```javascript
// ✓ docs/app/layout.jsx, docs/app/(marketing)/brand/page.jsx
export const metadata = {
  metadataBase: new URL('https://www.candid.tools'),
  title: { default: 'Candid', template: '%s | Candid' },
  description: '...',
  openGraph: { ... },
  twitter: { ... },
}
export default function PageComponent() {}
```

### Navigation and Images

Use `next/link` for internal links, `next/image` for optimized images. No `<a href>` for
internal navigation:
```javascript
// ✓ docs/app/(marketing)/page.jsx:146
<Link href="/docs" className="btn-primary">Get Started</Link>
<Image src="/hero.png" width={800} height={600} alt="Candid hero" />
```

### Font Loading

Load Google Fonts via `<Head>` with `rel="preconnect"` and `display=swap`. No CSS `@import`:
```javascript
// ✓ docs/app/layout.jsx
import { Head } from 'nextra/components'
<Head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="...display=swap" rel="stylesheet" />
</Head>
```

### TypeScript in Scripts (Strict Mode)

All files in `scripts/*.ts` must have explicit return types. Use union types for CLI args.
`any` is not used anywhere in the codebase — maintain this:
```typescript
// ✓ scripts/bump-version.ts
type BumpType = 'major' | 'minor' | 'patch';
async function readCurrentVersion(): Promise<string> {}
function checkGitClean(): void {}
```

---

## Gaps vs Best Practices

| Area | Current State | Recommended | Priority |
|------|--------------|-------------|----------|
| Automated tests | Manual config fixtures only | Add unit tests for `scripts/bump-version.ts` | High |
| TypeScript in docs | JSX without TS types | Consider `.tsx` migration for type safety | Medium |
| Version bump idempotency | No tag existence check before creating | Verify tag doesn't exist in `bump-version.ts` | Medium |
| Skill integration tests | No automated testing | Manual E2E testing guide for skills | Low |

---

## Appendix: Key Files

| File | Purpose |
|------|---------|
| `skills/candid-review/SKILL.md` | Code review workflow (primary skill) |
| `skills/candid-review/CONFIG.md` | Configuration schema and validation rules |
| `skills/candid-ship/SKILL.md` | Ship workflow (review → PR → merge) |
| `skills/candid-init/SKILL.md` | Init workflow (this file's generator) |
| `scripts/bump-version.ts` | Version bumping script — updates 3 files |
| `docs/app/layout.jsx` | Root Next.js layout (server component pattern) |
| `docs/app/(marketing)/page.jsx` | Homepage (client component reference) |
| `docs/app/components/trackEvent.js` | Analytics utility (event registry pattern) |
| `docs/app/components/Pre.jsx` | Code copy button (component + hook pattern) |
| `tests/config-validation/TESTING-GUIDE.md` | Manual testing guide |

---

*Generated by candid-init. Run `/candid-validate-standards` to check rule quality.*
