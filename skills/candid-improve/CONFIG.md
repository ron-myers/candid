# Config File Handling for Candid Improve

## Config File Locations

- **User config:** `~/.candid/config.json`
- **Project config:** `.candid/config.json` (in project root)

`candid-improve` reads the same config file as the rest of the candid suite.
This document covers the fields **specific to** the output-improvement skill.
For `tone` and other shared fields, see `skills/candid-review/CONFIG.md`
(canonical reference).

**Namespace note:** this skill uses the `improveOutput` block. It is deliberately
separate from `candid-improve-implementation`'s `improve` block — the two skills
do different jobs (generic output refinement vs. code-quality pass) and must not
share config or state. Reading the wrong block cross-contaminates the skills.

## Schema Specification

```json
{
  "version": 1,
  "tone": "harsh" | "constructive",
  "improveOutput": {
    "mode": "auto" | "review-each" | "interactive",
    "iterations": 1,
    "maxIterations": 5,
    "lenses": ["intent", "completeness", "clarity", "concision", "craft"],
    "defaultDestination": "chat" | "file"
  }
}
```

**Field descriptions:**

- `version` (optional): Config schema version. Defaults to `1`.
- `tone` (optional): Critique tone. Exactly `"harsh"` or `"constructive"`. Shared with `candid-review`; same precedence loader.
- `improveOutput` (optional): Settings specific to `candid-improve`. If absent, all defaults apply.
  - `improveOutput.mode` (optional): Interaction level. Exactly `"auto"`, `"review-each"`, or `"interactive"`. CLI `--mode` overrides. Default `"auto"`.
  - `improveOutput.iterations` (optional): Number of critique→refine cycles when no other stop condition is set. Positive integer. CLI `--iterations` overrides. Default `1` (single pass).
  - `improveOutput.maxIterations` (optional): Hard cap for `--until-converged` / `--criteria` loops. Positive integer (1-20). CLI `--max-iterations` overrides. Default `5`.
  - `improveOutput.lenses` (optional): Subset of `"intent"`, `"completeness"`, `"clarity"`, `"concision"`, `"craft"`. Restricts which critique lenses run. Default: all five.
  - `improveOutput.defaultDestination` (optional): `"chat"` or `"file"`. Overrides the source-based destination default (see SKILL.md Step 5). CLI `--out`/`--in-place` override this.

## Validation Rules

1. **File must be valid JSON** — must parse without errors.
2. **Tone field validation** — if present, exactly `"harsh"` or `"constructive"` (case-sensitive).
3. **improveOutput field validation** — if present, must be an object.
   - `improveOutput.mode`: if present, exactly `"auto"`, `"review-each"`, or `"interactive"`. Invalid values warn and are ignored.
   - `improveOutput.iterations`: if present, positive integer. Out-of-range/non-integer values warn and are ignored (defaults to 1).
   - `improveOutput.maxIterations`: if present, positive integer 1-20. Out-of-range values warn and are ignored (defaults to 5).
   - `improveOutput.lenses`: if present, an array whose entries are all in the allowed set. Unknown entries are dropped with a warning; an empty result falls back to all five.
   - `improveOutput.defaultDestination`: if present, exactly `"chat"` or `"file"`. Invalid values warn and are ignored.
4. **Unknown fields ignored** — forward compatibility.
5. **Empty object is valid** — `{}` is a valid config; the system continues to the next source.

## Config Validation Procedure

Same reusable procedure as `candid-review`. See `skills/candid-review/CONFIG.md`
→ "Config Validation Procedure" for the canonical text. Extraction paths for
this skill's fields:

```bash
jq -r '.improveOutput.mode // "none"' [config_path]
jq -r '.improveOutput.iterations // "none"' [config_path]
jq -r '.improveOutput.maxIterations // "none"' [config_path]
jq -r '.improveOutput.defaultDestination // "none"' [config_path]
```

## Error Handling

On any invalid value, show `⚠️  Invalid config at [path]: [specific error]. Falling back to [next source].` and continue to the next precedence level (or the default). Specific errors: `malformed JSON`; `invalid improveOutput.mode "[value]" (must be "auto", "review-each", or "interactive")`; `invalid improveOutput.iterations "[value]" (must be positive integer)`; `invalid improveOutput.maxIterations "[value]" (must be positive integer 1-20)`; `invalid improveOutput.defaultDestination "[value]" (must be "chat" or "file")`.

## Success Message Template

```
Using [tone] tone (from [source])
Mode: [mode] (from [source])
Stop condition: [single pass | N iterations | until converged | rubric] (from [source])
```

### Source Values

- `"CLI flag"` — when a flag provided the value
- `"project config"` — from `.candid/config.json`
- `"user config"` — from `~/.candid/config.json`
- `"default"` — when no source set the value

## Config File Examples

**Full config:**
```json
{
  "version": 1,
  "tone": "harsh",
  "improveOutput": {
    "mode": "review-each",
    "iterations": 1,
    "maxIterations": 5,
    "lenses": ["intent", "clarity", "concision"],
    "defaultDestination": "chat"
  }
}
```

**Coexisting with candid-improve-implementation:**
```json
{
  "version": 1,
  "tone": "harsh",
  "improve": {
    "focus": "clarity",
    "maxOpportunities": 5
  },
  "improveOutput": {
    "mode": "auto"
  }
}
```
Here `improve.*` applies to `/candid-improve-implementation` (code-quality pass)
and `improveOutput.*` applies to `/candid-improve` (output refinement). They do
not interfere.
