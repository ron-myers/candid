# Config File Handling for Candid Review

## Config File Locations

- **User config:** `~/.candid/config.json`
- **Project config:** `.candid/config.json` (in project root)

## Schema Specification

Valid config file format:

```json
{
  "tone": "harsh" | "constructive"
}
```

The `tone` field is optional. If not specified, the config file is treated as having no preference, and the system continues to the next precedence level.

## Validation Rules

1. **File must be valid JSON** - Must parse without errors
2. **Tone field validation** - If `tone` field is present, value must be exactly `"harsh"` or `"constructive"`
3. **Unknown fields ignored** - Any fields other than `tone` are ignored for forward compatibility
4. **Empty object is valid** - `{}` is a valid config with no tone preference set, system continues to next source

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
