---
name: candid-loop
description: Run candid-review in a loop until all issues are resolved, with configurable auto, review-each, or interactive modes and support for ignored issues
---

# Candid Loop

Run `candid-review` repeatedly until your code is clean. This skill automates the fix-review-fix cycle, applying fixes and re-running reviews until no issues remain (or max iterations is reached).

## Workflow

Execute these steps in order:

### Step 1: Load Configuration

Load loop configuration from CLI flags and config files.

**Precedence (highest to lowest):**
1. CLI flags
2. Project config (`.candid/config.json` → `loop` field)
3. User config (`~/.candid/config.json` → `loop` field)
4. Defaults

#### Check CLI Arguments

Parse CLI arguments for loop options:

| Flag | Description | Default |
|------|-------------|---------|
| `--mode <auto\|review-each\|interactive>` | Execution mode | `auto` |
| `--max-iterations <N>` | Maximum loop iterations | `5` |
| `--categories <list>` | Categories to enforce (comma-separated) | `all` |

**Valid modes:**
- `auto` - Automatically apply all fixes
- `review-each` - Go through each fix one by one (Yes/No for each)
- `interactive` - Full control with skip, ignore, and batch options

**Valid categories:** `critical`, `major`, `standards`, `smell`, `edge_case`, `architectural`, `all`

If CLI flags are provided, use them and skip config file checks for those specific options.

#### Check Config Files and Apply Defaults

Read the `loop` field from `.candid/config.json` (`jq -r '.loop // null' .candid/config.json 2>/dev/null`); if absent, try `~/.candid/config.json`. For each of `mode`, `maxIterations`, `enforceCategories` not set by CLI, take the config value; also extract `ignored` {categories, patterns, ids}. Output `Using loop settings from project config` or `Using loop settings from user config` when applied.

Defaults for anything still unset: `mode = "auto"`, `maxIterations = 5`, `enforceCategories = ["all"]`, `ignored = { categories: [], patterns: [], ids: [] }`.

- Add patterns to the ignore list for known false positives.
- Keep maxIterations at 5-10.

### Step 2: Initialize Loop State

Set up tracking variables:

```
iteration = 0
totalFixesApplied = 0
allFixedIssues = []
registerQuestionsRaised = 0
registerQuestionsResolved = 0
registerPriorDecisionsApplied = 0
```

Display mode banner: `[<Mode> Mode] Running candid-loop with max [N] iterations...` followed by a second line for review-each ("You will review each fix one by one.") or interactive ("Full control: skip, ignore, or batch process fixes.").

### Step 3: Run Review Loop

Execute the main loop:

```
WHILE iteration < maxIterations:
    iteration++

    Execute Step 3.1 through Step 3.6

    IF exitLoop == true:
        BREAK

IF iteration >= maxIterations AND remainingIssues > 0:
    Output warning: "Max iterations ([N]) reached. [M] issues remain."
    List remaining issues
```

### Loop Invariants — do not violate

1. **PASS requires a fresh clean review.** Status PASS only if the final iteration ran candid-review AFTER the last fix was applied and found 0 filtered issues. Verify `.candid/last-review.json` timestamp postdates the last Edit. Never infer PASS from an earlier iteration.
2. **No progress → stop.** If an iteration applies 0 fixes and filtered issues remain, exit INCOMPLETE immediately — repeating the identical review cannot converge.
3. **Oscillation check.** If an issue id already in `allFixedIssues` reappears in a later iteration, stop: `Oscillation detected: fix for [id] was undone or reintroduced.` List both fixes for manual resolution.
4. **Don't re-ask rejected issues.** Add ids skipped via "No"/"Skip" to `sessionSkipped`; filter them in Step 3.4 in later iterations. They count toward INCOMPLETE, not re-prompts.

#### Step 3.1: Run candid-review

Display iteration header:
```
[Iteration [N]/[MAX]]
Running candid-review...
```

Invoke the candid-review skill to analyze current code:
- Use the Skill tool to run `/candid-review`
- Pass through tone settings if configured
- Wait for review to complete and save state to `.candid/last-review.json`

**Note:** candid-review will present its own fix selection prompt. In auto mode, we need to handle this by selecting "Apply all fixes". In interactive mode, we defer to the user's choices within candid-review.

**Decision Register:** If the decision register is enabled in config, each candid-review iteration reads and updates the register file independently. This means:
- Questions raised in iteration 1 are recorded in the register
- In iteration 2+, candid-review checks the register before raising the same question again
- If a question was answered in a previous iteration, the answer is reused automatically
- In auto mode, Clarification Needed issues with prior answers from the register are applied without prompting

#### Step 3.2: Read Review Results

After candid-review completes, read the saved review state:

```bash
cat .candid/last-review.json 2>/dev/null
```

Parse the JSON to extract:
- `issues` array with all found issues
- Each issue has: `id`, `file`, `line`, `category`, `title`, `description`

If file doesn't exist or is empty:
```
No review state found. candid-review may not have completed.
```
Exit with error.

#### Step 3.3: Filter Issues by Category

If `enforceCategories` is NOT `["all"]`:

Filter the issues array to only include issues matching enforceCategories:

```
filteredIssues = issues.filter(issue =>
    enforceCategories.includes(issue.category)
)
```

Output: `Enforcing categories: [list]. Filtered to [N] issues.`

#### Step 3.4: Filter Out Ignored Issues

Apply the ignored filters from config: remove any issue whose category is in `ignored.categories`, whose title matches any regex in `ignored.patterns` (case-insensitive), or whose id is in `ignored.ids`.

If any issues were filtered:
```
Filtered out [N] ignored issues ([M] remaining)
```

#### Step 3.5: Check for Completion

If `filteredIssues.length === 0`:

```
[Iteration [N]/[MAX]] No issues found!

exitLoop = true
```

Skip to Step 4 (Summary).

#### Step 3.6: Handle Issues Based on Mode

**If mode == "auto":**

Display found issues:
```
[N/MAX] Found [M] issues. Applying fixes...
```

The candid-review skill will have already applied fixes if the user selected "Apply all fixes" in its prompt. Since we're in auto mode, we should have configured candid-review to auto-apply.

For each issue that was fixed, log:
```
      ✓ [icon] Fixed: [title] in [file]:[line]
```

Track fixes:
```
totalFixesApplied += appliedCount
allFixedIssues.push(...appliedIssues)
```

**Decision Register in auto mode:**

If the decision register is enabled, candid-review handles register consultation during its Step 6 (before raising Clarification Needed questions). In auto mode:
- Prior decisions from the register are applied automatically by candid-review — log: `Applied prior decision (#N) for [file]`
- New Clarification Needed issues (no prior answer) are NOT auto-applied — they require human input and are recorded as `open` in the register
- These are treated as "skipped" in the loop — they do not count as remaining issues that block loop completion
- Output: `Applied [N] prior decisions, skipped [M] new questions requiring clarification`

Track register activity:
```
registerPriorDecisionsApplied += priorDecisionsCount
registerQuestionsRaised += newQuestionsCount
registerQuestionsResolved += resolvedCount
```

Where `resolvedCount` comes from candid-review's Step 10.5 output — it includes questions answered by the user during Phase 8b and auto-resolutions from re-review. Read the register file after each iteration to count newly resolved entries compared to the previous read.

Continue to next iteration.

**If mode == "review-each":**

Go through each fix one by one with simple Yes/No prompts.

Display found issues:
```
[N/MAX] Found [M] issues. Reviewing each...
```

For each issue, use AskUserQuestion:

```
[1/M] [icon] [title]
File: [file]:[line]
Problem: [description]
```

**Question:** "Apply this fix?"

**Options:**
1. "Yes, apply this fix"
2. "No, skip this fix"

Track user choices:
- If "Yes" → Apply the fix, increment totalFixesApplied
- If "No" → Continue to next issue

After processing all issues, if any fixes were applied, continue to next iteration.

**If mode == "interactive":**

Full control mode with additional options for skipping, ignoring, and batch processing.

Display found issues:
```
Found [M] issues:
```

For each issue, use AskUserQuestion:

```
[1/M] [icon] [title]
File: [file]:[line]
Problem: [description]
```

**Question:** "How would you like to handle this issue?"

**Options:**
1. "Apply fix" - Apply this fix and continue
2. "Skip" - Skip this issue and continue to next
3. "Add to ignore list" - Add this issue ID to ignored.ids and skip
4. "Skip all remaining" - Exit the loop with remaining issues listed

Track user choices:
- If "Apply fix" → Apply the fix, increment totalFixesApplied
- If "Skip" → Continue to next issue
- If "Add to ignore list" → Add issue.id to ignored.ids in config, continue
- If "Skip all remaining" → Set exitLoop = true, break inner loop

After processing all issues in interactive mode, if any fixes were applied, continue to next iteration.

### Step 3.7: Update Ignore List (If Requested)

If user chose "Add to ignore list" for any issues:

1. Read current `.candid/config.json` (or create if doesn't exist)
2. Add issue IDs to `loop.ignored.ids` array
3. Write updated config back to file

```bash
# Read, modify, write
jq '.loop.ignored.ids += ["issue-id-1", "issue-id-2"]' .candid/config.json > tmp.json
mv tmp.json .candid/config.json
```

Output: `Added [N] issues to ignore list in .candid/config.json`

### Step 4: Display Summary

After loop exits (success or max iterations), display final summary:

```
Candid Loop [Complete|Stopped|Cancelled]

Summary:
- Iterations: [N]
- Issues fixed: [M]
- Status: [PASS|INCOMPLETE|CANCELLED]
```

If INCOMPLETE: add `Issues remaining: [P]` and list remaining issues as `[icon] [title] in [file]:[line]`, plus tips: increase `--max-iterations`, add persistent ignores for false positives, review complex issues manually.

If CANCELLED: add `Issues skipped: [P]` and list skipped issues.

**Decision Register section (add to all summary variants when register is enabled):**

If `decisionRegister.enabled == true` in config, append this section to whichever summary is displayed:

```
Decision Register:
- Prior decisions applied: [N]
- New questions raised: [M]
- Questions resolved: [P]
- Open questions: [Q]
```

If open questions remain:
```
Open questions can be reviewed at: [registerPath]/review-decision-register.md
```

## Configuration

### Config File Schema

Add to `.candid/config.json`:

```json
{
  "version": 1,
  "tone": "harsh",
  "loop": {
    "mode": "auto",
    "maxIterations": 5,
    "enforceCategories": ["all"],
    "ignored": {
      "categories": [],
      "patterns": [],
      "ids": []
    }
  }
}
```

### Field Descriptions

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `loop.mode` | string | `"auto"` | `"auto"`, `"review-each"`, or `"interactive"` |
| `loop.maxIterations` | number | `5` | Maximum review-fix cycles |
| `loop.enforceCategories` | array | `["all"]` | Categories to enforce |
| `loop.ignored.categories` | array | `[]` | Categories to skip entirely |
| `loop.ignored.patterns` | array | `[]` | Regex patterns to match issue titles (example: `["Unicode", "timezone"]`) |
| `loop.ignored.ids` | array | `[]` | Specific issue IDs to skip |

## CLI Examples

```bash
# Run with defaults (auto mode, all categories, max 5 iterations)
/candid-loop

# Combine flags
/candid-loop --mode review-each --max-iterations 10 --categories critical,major
```

## Issue Categories Reference

| Category | Icon | Description |
|----------|------|-------------|
| `critical` | 🔥 | Production killers: crashes, security holes, data loss |
| `major` | ⚠️ | Serious problems: performance, missing error handling |
| `standards` | 📜 | Technical.md violations |
| `smell` | 📋 | Maintainability: complexity, duplication |
| `edge_case` | 🤔 | Unhandled scenarios: null, empty, concurrent |
| `architectural` | 💭 | Design concerns: coupling, SRP violations |
