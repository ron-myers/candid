# Config File Testing Guide

This directory contains test config files for validating the config file integration.

## Test Files

- `valid-harsh.json` - Valid config with harsh tone
- `valid-constructive.json` - Valid config with constructive tone
- `valid-empty.json` - Valid but empty config (should fallback)
- `valid-with-extra-fields.json` - Valid config with unknown fields (should be ignored)
- `invalid-bad-tone.json` - Valid JSON but invalid tone value
- `invalid-malformed.json` - Malformed JSON (missing closing brace)

## Manual Testing Checklist

Run `/candid-review` in each scenario and verify behavior:

### Precedence Tests

1. **No configs, no flags**
   - Expected: Interactive prompt appears
   - Verify: Shows "Using [tone] tone (from interactive prompt)"

2. **User config exists**
   - Create: `~/.candid/config.json` with `{"tone": "harsh"}`
   - Expected: Uses user config, skips prompt
   - Verify: Shows "Using harsh tone (from user config)"

3. **Project + user config**
   - User config: `{"tone": "harsh"}`
   - Project config: `.candid/config.json` with `{"tone": "constructive"}`
   - Expected: Uses project config (higher precedence)
   - Verify: Shows "Using constructive tone (from project config)"

4. **Project config + CLI flag**
   - Project config: `{"tone": "harsh"}`
   - Run: `/candid-review --constructive`
   - Expected: Uses CLI flag (highest precedence)
   - Verify: Shows "Using constructive tone (from CLI flag)"

### Error Handling Tests

5. **Malformed JSON in project config**
   - Copy `invalid-malformed.json` to `.candid/config.json`
   - Expected: Warning shown, falls back to user config
   - Verify: Shows "⚠️  Invalid config at .candid/config.json: malformed JSON. Falling back to user config."

6. **Invalid tone value**
   - Copy `invalid-bad-tone.json` to `.candid/config.json`
   - Expected: Warning with valid values, fallback
   - Verify: Warning includes 'invalid tone "medium" (must be "harsh" or "constructive")'

7. **Empty config**
   - Copy `valid-empty.json` to `.candid/config.json`
   - Expected: Silent fallback to next source
   - Verify: No warning, continues to user config or prompt

8. **Config with unknown fields**
   - Copy `valid-with-extra-fields.json` to `.candid/config.json`
   - Expected: Uses tone, ignores unknown fields
   - Verify: Shows "Using harsh tone (from project config)", no warnings

### Source Transparency Tests

9. **CLI flag**
   - Run: `/candid-review --harsh`
   - Verify: Shows "Using harsh tone (from CLI flag)"

10. **Project config**
    - Create: `.candid/config.json` with `{"tone": "constructive"}`
    - Verify: Shows "Using constructive tone (from project config)"

11. **User config**
    - Only `~/.candid/config.json` exists with `{"tone": "harsh"}`
    - Verify: Shows "Using harsh tone (from user config)"

12. **Interactive prompt**
    - No configs exist, no CLI flags
    - Select tone when prompted
    - Verify: Shows "Using [tone] tone (from interactive prompt)"

### Edge Cases

13. **File permission errors**
    - Create config with no read permissions: `chmod 000 ~/.candid/config.json`
    - Expected: Graceful warning and fallback
    - Verify: Review still works

14. **Symlinked config file**
    - Create config elsewhere, symlink to it
    - Expected: Reads correctly
    - Verify: Tone is loaded from symlinked file

15. **Config with only whitespace**
    - Create config with just spaces
    - Expected: Treated as invalid JSON
    - Verify: Warning shown, fallback occurs

### Merge Target Branch Tests

16. **Valid single merge target**
    - Config: `valid-merge-target-single.json`
    - Expected: Uses `["develop"]`
    - Verify: Shows "Using merge target branches: ["develop"] (from project config)"

17. **Valid multiple merge targets**
    - Config: `valid-merge-target-multiple.json`
    - Expected: Tries in order, uses first available

18. **Invalid empty array**
    - Config: `invalid-merge-target-empty.json`
    - Expected: Warning shown, uses default `["main", "stable", "master"]`

19. **Invalid type (string not array)**
    - Config: `invalid-merge-target-string.json`
    - Expected: Warning shown, falls back to default

20. **CLI override test**
    - Config with `["main"]`, run with `--merge-target develop`
    - Expected: Uses `["develop"]` from CLI
    - Verify: Shows "(from CLI flags)"

### Commit Config Tests

21. **Valid autoCommit true**
    - Config: `{"autoCommit": true}`
    - Expected: Auto-commit enabled
    - Verify: Shows "Commit enabled: will create git commit after applying fixes (from project config)"

22. **Valid autoCommit false**
    - Config: `{"autoCommit": false}`
    - Expected: Auto-commit disabled (explicit)
    - Verify: No commit message shown, no auto-commit occurs

23. **Invalid autoCommit type (string)**
    - Config: `{"autoCommit": "yes"}`
    - Expected: Warning shown, falls back to next source
    - Verify: Shows "⚠️  Invalid config: invalid type for autoCommit field (must be boolean)"

24. **CLI override of config**
    - Config: `{"autoCommit": false}`, run with `--auto-commit`
    - Expected: Uses CLI flag (auto-commit enabled)
    - Verify: Shows "Commit enabled: will create git commit after applying fixes (from CLI flag)"

25. **Project overrides user**
    - User config: `{"autoCommit": true}`
    - Project config: `{"autoCommit": false}`
    - Expected: Uses project config (no auto-commit)
    - Verify: No commit occurs

## Quick Test Commands

```bash
# Test valid harsh config
cp tests/config-validation/valid-harsh.json .candid/config.json
# Run /candid-review and verify

# Test invalid config
cp tests/config-validation/invalid-malformed.json .candid/config.json
# Run /candid-review and verify warning

# Test empty config
cp tests/config-validation/valid-empty.json .candid/config.json
# Run /candid-review and verify fallback

# Clean up
rm .candid/config.json
```

## Success Criteria

- ✅ All precedence rules work correctly
- ✅ Invalid configs never crash the review
- ✅ Warning messages are clear and actionable
- ✅ Users always know which source provided the tone
- ✅ No breaking changes to existing behavior
- ✅ Forward compatible (unknown fields ignored)
