# Config File Handling for Candid Improve Implementation

## Config File Locations

- **User config:** `~/.candid/config.json`
- **Project config:** `.candid/config.json` (in project root)

`candid-improve-implementation` reads the same config file as `candid-review` and the rest of the candid suite. This file documents the fields **specific to or shared with** the improve-implementation skill. For ship/fastShip blocks, see `skills/candid-review/CONFIG.md` (canonical reference).

## Schema Specification

```json
{
  "version": 1,
  "tone": "harsh" | "constructive",
  "exclude": ["*.generated.ts", "vendor/*"],
  "mergeTargetBranches": ["main", "stable", "master"],
  "autoCommit": true | false,
  "improve": {
    "focus": "approach" | "clarity" | "quality",
    "noBugs": true | false,
    "maxOpportunities": 7
  }
}
```

**Field descriptions:**

- `version` (optional): Config schema version. Defaults to `1`.
- `tone` (optional): Review tone preference. Must be exactly `"harsh"` or `"constructive"`. Shared with `candid-review`. Same precedence loader.
- `exclude` (optional): Array of glob patterns for files to skip. Shared with `candid-review`. Merged with CLI `--exclude` flags.
- `mergeTargetBranches` (optional): Array of branches to compare against for branch-diff fallback. Defaults to `["main", "stable", "master"]`. Shared with `candid-review`.
- `autoCommit` (optional): If `true`, automatically commits after applying suggestions (equivalent to always passing `--auto-commit`). Defaults to `false`. Shared with `candid-review`.
- `improve` (optional): Settings specific to `candid-improve-implementation`. If absent, all defaults apply.
  - `improve.focus` (optional): Default focus area. Must be exactly `"approach"`, `"clarity"`, or `"quality"`. CLI `--focus` flag overrides. **Note:** `improve.focus` values are different from `candid-review`'s top-level `focus` (which uses `security|performance|architecture|edge-case`) — keep them separate to avoid cross-contamination.
  - `improve.noBugs` (optional): If `true`, suppress the 🐛 Bugs section by default. CLI `--no-bugs` overrides toward suppression. Defaults to `false` (bugs section included).
  - `improve.maxOpportunities` (optional): Cap on the number of opportunities surfaced. Must be a positive integer. Defaults to `7`. Lower values force tighter ranking.

## Validation Rules

1. **File must be valid JSON** — must parse without errors
2. **Tone field validation** — if `tone` is present, must be exactly `"harsh"` or `"constructive"` (case-sensitive)
3. **Exclude field validation** — if present, must be an array of non-empty strings
4. **mergeTargetBranches field validation** — if present, must be an array of non-empty strings; empty arrays show warning and are ignored
5. **AutoCommit field validation** — if present, must be a boolean
6. **Improve field validation** — if `improve` is present, must be an object
   - `improve.focus`: if present, must be exactly `"approach"`, `"clarity"`, or `"quality"` (case-sensitive). Invalid values show warning and are ignored.
   - `improve.noBugs`: if present, must be a boolean. Invalid values show warning and are ignored.
   - `improve.maxOpportunities`: if present, must be a positive integer (1-50). Out-of-range or non-integer values show warning and are ignored (defaults to 7).
7. **Unknown fields ignored** — forward compatibility
8. **Empty object is valid** — `{}` is a valid config; system continues to next source

## Config Validation Procedure

Same reusable procedure as `candid-review`. See `skills/candid-review/CONFIG.md` → "Config Validation Procedure" for the canonical text.

The only difference for this skill: when extracting the focus value, the field is `improve.focus` (nested under the `improve` block), not the top-level `focus` field.

```bash
jq -r '.improve.focus // "none"' [config_path]
```

Validation: must be `"approach"`, `"clarity"`, or `"quality"`.

## Error Handling

On any invalid value, show `⚠️  Invalid config at [path]: [specific error]. Falling back to [next source].` and continue to the next precedence level (or the default for maxOpportunities/noBugs). Specific errors: `malformed JSON`; `invalid improve.focus "[value]" (must be "approach", "clarity", or "quality")`; `invalid improve.maxOpportunities "[value]" (must be positive integer 1-50)`; `invalid improve.noBugs "[value]" (must be boolean)`.

## Success Message Template

When valid preferences are loaded:

```
Using [tone] tone (from [source])
Focusing improvement review on: [focus] (from [source])
Bugs section: suppressed (from [source])
Capping opportunities at [N] (from [source])
```

### Source Values

- `"CLI flag"` — when `--harsh`, `--constructive`, `--focus`, `--no-bugs`, or `--auto-commit` is provided
- `"project config"` — when loaded from `.candid/config.json`
- `"user config"` — when loaded from `~/.candid/config.json`
- `"default"` — when no source set the value

## Config File Examples

### Valid Configs

**Full config (improve + shared fields):**
```json
{
  "version": 1,
  "tone": "harsh",
  "exclude": ["*.generated.ts"],
  "mergeTargetBranches": ["stable", "main"],
  "autoCommit": false,
  "improve": {
    "focus": "approach",
    "noBugs": false,
    "maxOpportunities": 7
  }
}
```

**Coexisting with candid-review config:**
```json
{
  "version": 1,
  "tone": "harsh",
  "focus": "security",
  "exclude": ["*.generated.ts"],
  "improve": {
    "focus": "clarity",
    "maxOpportunities": 5
  }
}
```
Here `focus: "security"` applies to `/candid-review`; `improve.focus: "clarity"` applies to `/candid-improve-implementation`. They do not interfere.

Wrong-type or out-of-range improve.* values warn and fall through to the next source.
