# Troubleshooting

Common issues and how to fix them.

---

## "No changes detected to review"

**Cause:** Candid couldn't find changes to review.

**Solutions:**

1. **Check git status**
   ```bash
   git status
   git diff --stat
   ```
   If nothing shows, you have no changes to review.

2. **Stage your changes**
   Candid prioritizes staged changes. If you have unstaged changes:
   ```bash
   git add -A  # Stage everything
   # or
   git add path/to/file  # Stage specific files
   ```

3. **Check your branch**
   If you're on a feature branch with no local changes, Candid compares to main/stable:
   ```bash
   git diff main...HEAD --stat
   ```
   If nothing shows, your branch has no new commits.

---

## Config Not Loading

**Symptoms:** Tone prompt appears even though you set up config.

**Checklist:**

1. **Verify file exists and is valid JSON**
   ```bash
   cat ~/.candid/config.json
   jq empty ~/.candid/config.json  # Should output nothing if valid
   ```

2. **Check tone value**
   Must be exactly `"harsh"` or `"constructive"` (case-sensitive):
   ```json
   {"tone": "harsh"}     ✓
   {"tone": "Harsh"}     ✗
   {"tone": "HARSH"}     ✗
   {"tone": "brutal"}    ✗
   ```

3. **Check precedence**
   - CLI flags override everything: `/candid-review --harsh`
   - Project config (`.candid/config.json`) overrides user config
   - User config (`~/.candid/config.json`) is last

4. **Look for warnings**
   Invalid configs show warnings like:
   ```
   ⚠️ Invalid config at .candid/config.json: malformed JSON. Falling back to user config.
   ```

---

## Technical.md Not Found

**Symptoms:** Review doesn't mention your standards, no 📜 violations.

**Checklist:**

1. **Check file location**
   Candid looks in this order:
   - `./Technical.md` (project root)
   - `./.claude/Technical.md`

2. **Check file name**
   Must be exactly `Technical.md` (capital T, capital M).

3. **Check file content**
   Open the file and verify it has actual rules, not just the template comments.

---

## Review Seems Shallow

**Symptoms:** Missing obvious issues, not checking enough context.

**Causes and fixes:**

1. **Large diff**
   For diffs over 500 lines, Candid may ask which files to prioritize. Focus on critical files first.

2. **Binary files**
   Binary files are noted but not reviewed. This is expected.

3. **Generated code**
   Candid reviews all code, including generated files. Consider using `--exclude` (coming soon) or adding to `.gitignore`.

4. **Force deeper analysis**
   If changes span multiple domains (frontend + backend + database), the subagent should trigger automatically. If not, the change may not meet the threshold (5+ files across domains).

---

## Subagent Not Triggering

**When it should trigger:**
- More than 5 files changed
- Changes span multiple domains (frontend + backend + database)
- Changes touch security, auth, or API contracts

**When it won't trigger:**
- Small changes (under 5 files)
- Changes in a single domain
- Simple refactors

This is intentional. The subagent adds latency and is reserved for complex changes.

---

## Fixes Not Applying

**Symptoms:** Selected fixes but code didn't change.

**Checklist:**

1. **Confirmation required**
   Did you confirm in Phase 7c? Fixes don't apply until you confirm.

2. **File conflicts**
   If the file changed between review and apply, the fix may not match.

3. **Check todos**
   If fixes couldn't be applied, they're added as todos instead:
   ```
   /todos
   ```

---

## Still Stuck?

1. **Check the logs** - Claude Code shows what's happening at each step
2. **Restart Claude Code** - Especially after plugin updates
3. **Report an issue** - [github.com/ron-myers/candid/issues](https://github.com/ron-myers/candid/issues)
