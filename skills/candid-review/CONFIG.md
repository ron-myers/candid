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
  "focus": "security" | "performance" | "architecture",
  "mergeTargetBranches": ["main", "develop", "master"]
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

## Validation Rules

1. **File must be valid JSON** - Must parse without errors
2. **Tone field type** - If `tone` field is present, must be a string (not boolean, number, array, or object)
3. **Tone field validation** - If `tone` is a string, value must be exactly `"harsh"` or `"constructive"` (case-sensitive)
4. **Focus field validation** - If `focus` field is present, must be exactly `"security"`, `"performance"`, `"architecture"`, or `"edge-case"` (case-sensitive). Invalid values show warning and are ignored.
5. **mergeTargetBranches field validation** - If present, must be an array of non-empty strings. Empty arrays or invalid values show warning and are ignored.
6. **Unknown fields ignored** - Any fields other than `tone`, `exclude`, `focus`, and `mergeTargetBranches` are ignored for forward compatibility
7. **Empty object is valid** - `{}` is a valid config with no preferences set, system continues to next source

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
  "focus": "performance"
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
