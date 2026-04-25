# Config File Handling for Candid Review

## Config File Locations

- **User config:** `~/.candid/config.json`
- **Project config:** `.candid/config.json` (in project root)

## Schema Specification

Valid config file format:

```json
{
  "version": 1,
  "tone": "harsh" | "constructive",
  "exclude": ["*.generated.ts", "vendor/*"],
  "focus": "security" | "performance" | "architecture" | "edge-case",
  "mergeTargetBranches": ["main", "develop", "master"],
  "autoCommit": true | false,
  "decisionRegister": {
    "enabled": true | false,
    "path": ".candid/register",
    "mode": "lookup" | "load"
  },
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "stable",
    "autoMerge": false,
    "additionalPrompt": "Focus on security",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS", "ENG", "DISC"],
      "state": "In Review",
      "prompt": "Update issue {issueId}: set its state to \"{state}\". Update only this one issue and only its state — do not modify any other issues, fields, or properties. If the issue is already in \"{state}\", report success without action. If the issue is missing or inaccessible, report the error and stop."
    }
  },
  "fastShip": {
    "review": false,
    "build": false,
    "tests": false,
    "issueTracker": false,
    "autoMerge": true,
    "postMergeCommand": false,
    "targetBranch": "stable"
  }
}
```

**Field descriptions:**
- `version` (optional): Config schema version. Defaults to 1 if omitted. Used for future-proofing.
- `tone` (optional): Review tone preference. Must be exactly `"harsh"` or `"constructive"`. If not specified, the config file is treated as having no preference, and the system continues to the next precedence level.
- `exclude` (optional): Array of glob patterns for files to skip during review. Patterns are merged from project config, user config, and CLI `--exclude` flags. Common patterns:
  - `*.generated.ts` - Generated code
  - `*.min.js` - Minified files
  - `vendor/*` - Third-party code
  - `**/*.test.ts` - Test files (if you want to skip them)
- `focus` (optional): Default focus area for reviews. Must be exactly `"security"`, `"performance"`, `"architecture"`, or `"edge-case"`. CLI `--focus` flag overrides this. When set, only relevant issue categories are checked.
- `mergeTargetBranches` (optional): Array of branch names for comparing branch diffs. Candid tries each in order, using the first that exists. Defaults to `["main", "stable", "master"]`. Common patterns:
  - `["main"]` - GitHub Flow
  - `["develop", "main"]` - Git Flow
  - `["trunk"]` - Trunk-based development
  - `["origin/main", "main"]` - CI environments
- `autoCommit` (optional): Default auto-commit behavior. If `true`, automatically creates git commits after applying fixes (equivalent to always using `--auto-commit` flag). If `false` or omitted, commits only when `--auto-commit` flag is provided. Defaults to `false`.
- `decisionRegister` (optional): Configuration for the decision register feature. Tracks questions and decisions raised during reviews. If not present, defaults to disabled.
  - `decisionRegister.enabled` (optional): Whether to track questions and decisions during reviews. When enabled, the reviewer checks the register for prior answers before asking new questions, and records new questions/answers for future sessions. Defaults to `false`.
  - `decisionRegister.path` (optional): Directory path where the register file is stored. The file will be named `review-decision-register.md` inside this directory. Defaults to `".candid/register"`.
  - `decisionRegister.mode` (optional): How the register is consulted during reviews. Must be exactly `"lookup"` or `"load"`. Defaults to `"lookup"`.
    - `"lookup"` — Before raising each Clarification Needed question, check the register for a matching resolved answer. If found, reuse the prior answer instead of re-asking. Efficient for large registers.
    - `"load"` — Load the entire register into context at the start of the review. The reviewer has full awareness of all prior decisions throughout. Better for small-to-medium registers where broad context helps.
- `ship` (optional): Configuration for the candid-ship shipping workflow. If not present, candid-ship uses defaults for all settings.
  - `ship.buildCommand` (optional): Shell command for build verification before creating PR. If not set, build step is skipped. Must be a non-empty string.
  - `ship.testCommand` (optional): Shell command for running tests before creating PR. If not set, test step is skipped. Must be a non-empty string.
  - `ship.installCommand` (optional): Shell command to install dependencies before build. Runs before `buildCommand` (and before `testCommand`). If not set, the install step is skipped. Common values: `"pnpm install"`, `"npm ci"`, `"poetry install"`, `"bundle install"`. Must be a non-empty string.
  - `ship.targetBranch` (optional): Branch name for PR target. Defaults to first entry in `mergeTargetBranches` or `"main"`. Must be a non-empty string.
  - `ship.autoMerge` (optional): Whether to auto-merge the PR after creation via `gh pr merge --squash --auto`. Defaults to `false`. Must be a boolean.
  - `ship.additionalPrompt` (optional): Extra prompt text passed to candid-loop/candid-review as additional review context. Must be a non-empty string.
  - `ship.postMergeCommand` (optional): Shell command to run after auto-merge is successfully enabled. Only executes when `autoMerge` is `true` and `gh pr merge --squash --auto` succeeds. If the command fails, a warning is shown but the workflow is not aborted. Must be a non-empty string.
  - `ship.issueTracker` (optional): Configuration for auto-updating an issue tracker after PR creation. Opt-in. If absent, the issue-tracker step is skipped silently — the rest of the ship runs unchanged. Currently `provider: "linear"` is the only supported provider; other values produce a warning with a link to request support. Sub-fields:
    - `ship.issueTracker.provider` (optional): Issue tracker name. Currently only `"linear"` is supported. Defaults to `"linear"`. Future values may include `"asana"`, `"jira"`, `"github"`, etc. — set `"none"` (or omit `issueTracker` entirely) to disable.
    - `ship.issueTracker.enabled` (optional): Whether to attempt the issue update. Defaults to `false`. Must be a boolean.
    - `ship.issueTracker.teamPrefixes` (optional): Array of team key prefixes to match in branch names (e.g. for Linear, the letters before the dash in any issue ID). Defaults to `["DIS", "ENG", "DISC"]` — **edit this to match your tracker workspace's team keys.** Must be an array of non-empty strings.
    - `ship.issueTracker.state` (optional): The workflow state to transition the issue to. Defaults to `"In Review"`. Must match a state name in your tracker workspace exactly (case-sensitive). Must be a non-empty string.
    - `ship.issueTracker.prompt` (optional): Customizable prompt template sent to the tracker's MCP server. Supports `{issueId}`, `{state}`, and `{provider}` placeholders. The rendered prompt **must restrict the action to a single issue** — multiple-issue updates are explicitly disallowed. Defaults to: `Update issue {issueId}: set its state to "{state}". Update only this one issue and only its state — do not modify any other issues, fields, or properties. If the issue is already in "{state}", report success without action. If the issue is missing or inaccessible, report the error and stop.` This default also restricts the change to the `state` field (no assignee/label/title changes), is idempotent (no-op if already in `{state}`), and stops on a missing-issue error rather than searching for a fallback. candid-init writes this default into `.candid/config.json` so it's discoverable and easy to edit. Must be a non-empty string.
- `fastShip` (optional): Configuration for the `candid-fast-ship` minimal shipping workflow. Unlike `ship` (which runs all steps by default), `fastShip` is **opt-in**: every step is disabled by default and must be explicitly enabled. Command values and issue tracker configuration are inherited from the `ship` block. If not present, `candid-fast-ship` runs with all steps disabled (PR creation only).
  - `fastShip.review` (optional): Run candid-loop code review. Defaults to `false`. Must be a boolean.
  - `fastShip.install` (optional): Run `ship.installCommand`. Skipped silently if `ship.installCommand` is not set. Defaults to `false`. Must be a boolean.
  - `fastShip.build` (optional): Run `ship.buildCommand`. Skipped silently if `ship.buildCommand` is not set. Defaults to `false`. Must be a boolean.
  - `fastShip.tests` (optional): Run `ship.testCommand`. Skipped silently if `ship.testCommand` is not set. Defaults to `false`. Must be a boolean.
  - `fastShip.issueTracker` (optional): Update issue tracker after PR creation. Uses `ship.issueTracker` for provider, state, and prompt configuration. `ship.issueTracker.enabled` is ignored — this toggle takes precedence. Skipped silently if `ship.issueTracker` is not configured. Defaults to `false`. Must be a boolean.
  - `fastShip.autoMerge` (optional): Auto-merge PR via `gh pr merge --squash --auto`. Defaults to `false`. Must be a boolean.
  - `fastShip.postMergeCommand` (optional): Run `ship.postMergeCommand` after auto-merge succeeds. Only executes when `fastShip.autoMerge` is `true` and auto-merge succeeds. Skipped silently if `ship.postMergeCommand` is not set. Defaults to `false`. Must be a boolean.
  - `fastShip.targetBranch` (optional): PR target branch. Defaults to `ship.targetBranch` → first `mergeTargetBranches` entry → `"main"`. Must be a non-empty string.

## Validation Rules

1. **File must be valid JSON** - Must parse without errors
2. **Tone field type** - If `tone` field is present, must be a string (not boolean, number, array, or object)
3. **Tone field validation** - If `tone` is a string, value must be exactly `"harsh"` or `"constructive"` (case-sensitive)
4. **Focus field validation** - If `focus` field is present, must be exactly `"security"`, `"performance"`, `"architecture"`, or `"edge-case"` (case-sensitive). Invalid values show warning and are ignored.
5. **mergeTargetBranches field validation** - If present, must be an array of non-empty strings. Empty arrays or invalid values show warning and are ignored.
6. **AutoCommit field validation** - If `autoCommit` field is present, must be a boolean (`true` or `false`). Invalid values show warning and are ignored.
7. **DecisionRegister field validation** - If `decisionRegister` field is present, must be an object. If `decisionRegister.enabled` is present, must be a boolean. If `decisionRegister.path` is present, must be a non-empty string. If `decisionRegister.mode` is present, must be exactly `"lookup"` or `"load"` (case-sensitive). Invalid values show warning and are ignored (feature defaults to disabled).
8. **Ship field validation** - If `ship` field is present, must be an object. If `ship.buildCommand` is present, must be a non-empty string. If `ship.testCommand` is present, must be a non-empty string. If `ship.installCommand` is present, must be a non-empty string. If `ship.targetBranch` is present, must be a non-empty string. If `ship.autoMerge` is present, must be a boolean. If `ship.additionalPrompt` is present, must be a non-empty string. If `ship.postMergeCommand` is present, must be a non-empty string. If `ship.issueTracker` is present, must be an object. If `ship.issueTracker.provider` is present, must be a non-empty string. If `ship.issueTracker.enabled` is present, must be a boolean. If `ship.issueTracker.teamPrefixes` is present, must be an array of non-empty strings. If `ship.issueTracker.state` is present, must be a non-empty string. If `ship.issueTracker.prompt` is present, must be a non-empty string. Invalid values show warning and are ignored — the ship continues without the issue tracker step.
9. **FastShip field validation** - If `fastShip` field is present, must be an object. Boolean fields (`review`, `install`, `build`, `tests`, `issueTracker`, `autoMerge`, `postMergeCommand`) must be booleans if present. `targetBranch` must be a non-empty string if present. Invalid values show warning and are ignored — `fastShip` defaults to all steps disabled.
10. **Unknown fields ignored** - Any fields other than `tone`, `exclude`, `focus`, `mergeTargetBranches`, `autoCommit`, `decisionRegister`, `ship`, and `fastShip` are ignored for forward compatibility
10. **Empty object is valid** - `{}` is a valid config with no preferences set, system continues to next source

## Config Validation Procedure

This reusable procedure applies to both project and user configs:

**Inputs:**
- `config_path`: Path to the config file (`.candid/config.json` or `~/.candid/config.json`)
- `config_source`: Source name for messages (`"project config"` or `"user config"`)
- `fallback_source`: What to fall back to on error (`"user config"` or `"interactive prompt"`)

**Steps:**
1. **Check file existence:**
   - If file doesn't exist → Return `CONTINUE` (silent, no warning)

2. **Read file content:**
   - Use Read tool to get file content
   - If read fails (permissions, etc.) → Show warning, return `CONTINUE`

3. **Validate JSON syntax:**
   ```bash
   jq empty [config_path] 2>&1
   ```
   - If command fails → Show warning "malformed JSON", return `CONTINUE`

4. **Extract tone value:**
   ```bash
   jq -r '.tone // "none"' [config_path]
   ```

5. **Validate tone field:**
   - If tone is "none" (field missing) → Return `CONTINUE` (silent)
   - If tone is not a string type → Show warning "invalid type", return `CONTINUE`
   - If tone ≠ "harsh" AND tone ≠ "constructive" → Show warning with valid values, return `CONTINUE`

6. **Success:**
   - Set tone from config
   - Output: `Using [tone] tone (from [config_source])`
   - Return `SKIP_TO_STEP_5`

**Return values:**
- `SKIP_TO_STEP_5` - Valid config found, skip remaining checks
- `CONTINUE` - No valid config, continue to next precedence level

## Error Handling Instructions

When reading config files, handle these error scenarios:

### Invalid JSON
- **Error message:** `"malformed JSON"`
- **Action:** Show warning, continue to next precedence level

### Invalid Tone Value
- **Error message:** `'invalid tone "[value]" (must be "harsh" or "constructive")'`
- **Action:** Show warning, continue to next precedence level

### File Read Error
Includes permission errors, I/O errors, etc.
- **Error message:** `"cannot read file: [error message]"`
- **Action:** Show warning, continue to next precedence level

## Warning Message Template

```
⚠️  Invalid config at [path]: [specific error]. Falling back to [next source].
```

### Examples

**Malformed JSON:**
```
⚠️  Invalid config at .candid/config.json: malformed JSON. Falling back to user config.
```

**Invalid tone value:**
```
⚠️  Invalid config at ~/.candid/config.json: invalid tone "medium" (must be "harsh" or "constructive"). Falling back to interactive prompt.
```

**File read error:**
```
⚠️  Invalid config at .candid/config.json: cannot read file: Permission denied. Falling back to user config.
```

## Success Message Template

When a valid tone preference is loaded from any source:

```
Using [tone] tone (from [source])
```

### Source Values

- `"CLI flag"` - When `--harsh` or `--constructive` is provided
- `"project config"` - When loaded from `.candid/config.json`
- `"user config"` - When loaded from `~/.candid/config.json`
- `"interactive prompt"` - When user selects via AskUserQuestion

### Examples

```
Using harsh tone (from CLI flag)
Using constructive tone (from project config)
Using harsh tone (from user config)
Using constructive tone (from interactive prompt)
```

## Config File Examples

### Valid Configs

**Harsh tone:**
```json
{
  "tone": "harsh"
}
```

**Harsh tone with version:**
```json
{
  "version": 1,
  "tone": "harsh"
}
```

**Constructive tone:**
```json
{
  "tone": "constructive"
}
```

**No preference (empty):**
```json
{}
```

**With exclusions:**
```json
{
  "tone": "harsh",
  "exclude": ["*.generated.ts", "vendor/*", "**/*.min.js"]
}
```

**With focus area:**
```json
{
  "tone": "constructive",
  "focus": "security"
}
```

**Full config:**
```json
{
  "version": 1,
  "tone": "harsh",
  "exclude": ["*.generated.ts", "vendor/*"],
  "focus": "performance",
  "autoCommit": true
}
```

**With decision register (default lookup mode):**
```json
{
  "tone": "constructive",
  "decisionRegister": {
    "enabled": true
  }
}
```

**With decision register (load mode, custom path):**
```json
{
  "tone": "harsh",
  "decisionRegister": {
    "enabled": true,
    "path": "docs/decisions",
    "mode": "load"
  }
}
```

**Full config with decision register:**
```json
{
  "version": 1,
  "tone": "harsh",
  "exclude": ["*.generated.ts", "vendor/*"],
  "focus": "performance",
  "autoCommit": true,
  "decisionRegister": {
    "enabled": true,
    "path": ".candid/register",
    "mode": "lookup"
  }
}
```

**With ship configuration:**
```json
{
  "version": 1,
  "tone": "constructive",
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "main",
    "autoMerge": false
  }
}
```

**With install before build:**
```json
{
  "ship": {
    "installCommand": "pnpm install",
    "buildCommand": "pnpm build",
    "testCommand": "pnpm test",
    "targetBranch": "main"
  }
}
```

**With Linear issue tracker:**
```json
{
  "version": 1,
  "tone": "constructive",
  "ship": {
    "buildCommand": "npm run build",
    "targetBranch": "main",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS", "ENG"],
      "state": "In Review"
    }
  }
}
```

**With custom issue tracker prompt:**
```json
{
  "ship": {
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS"],
      "state": "Code Review",
      "prompt": "Move {issueId} to \"{state}\" and add a comment that the PR is ready. Only modify this single issue."
    }
  }
}
```

**Full config with all features:**
```json
{
  "version": 1,
  "tone": "harsh",
  "exclude": ["*.generated.ts", "vendor/*"],
  "focus": "performance",
  "autoCommit": true,
  "decisionRegister": {
    "enabled": true,
    "path": ".candid/register",
    "mode": "lookup"
  },
  "ship": {
    "buildCommand": "npm run build",
    "testCommand": "npm test",
    "targetBranch": "stable",
    "autoMerge": true,
    "additionalPrompt": "Ensure error handling covers all async operations",
    "postMergeCommand": "curl -X POST https://deploy.example.com/trigger",
    "issueTracker": {
      "provider": "linear",
      "enabled": true,
      "teamPrefixes": ["DIS", "ENG", "DISC"],
      "state": "In Review"
    }
  },
  "fastShip": {
    "build": true,
    "issueTracker": true,
    "autoMerge": true
  }
}
```

**With fast ship only (minimal PR creation):**
```json
{
  "ship": {
    "buildCommand": "npm run build",
    "targetBranch": "main"
  },
  "fastShip": {}
}
```

**Fast ship with build and auto-merge:**
```json
{
  "ship": {
    "buildCommand": "npm run build",
    "targetBranch": "stable"
  },
  "fastShip": {
    "build": true,
    "autoMerge": true
  }
}
```

**With future fields (ignored):**
```json
{
  "tone": "harsh",
  "future_setting": "some_value"
}
```

### Invalid Configs

**Malformed JSON (missing closing brace):**
```json
{
  "tone": "harsh"
```

**Invalid tone value:**
```json
{
  "tone": "medium"
}
```

**Wrong type for tone:**
```json
{
  "tone": true
}
```
