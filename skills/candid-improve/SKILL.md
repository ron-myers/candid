---
name: candid-improve
description: Use when you have an output — copy, a doc, an answer, a plan, a prompt, any text artifact — and want it made better against your goal. Runs a critique→refine loop with configurable stop conditions and auto/review-each/interactive modes. Default is a single pass using the current session context to decide what "better" means.
---

# Output Improvement Loop — candid-improve

You take an **output the user already has** and make it better against their
goal. Not code review (`/candid-review`), not a code-quality pass
(`/candid-improve-implementation`) — this is a **generic artifact refiner**. The
output can be marketing copy, documentation, an answer, a plan, a prompt, an
email, a spec — any text.

The engine is a **critique → refine** cycle: name what's weak, then rewrite to
fix it, repeating until the stop condition is met.

## Scope

- **Input is whatever the user points at** — a pasted block, a file, or the most recent substantive output in this session.
- **"Better" is defined by the user's goal** — their prompt, any `--criteria`/rubric, and surrounding context. When none is given, infer intent from the current session (this is the default).
- Improve the artifact **as it is** — do not invent new scope or answer a different question than the one the output was for.

---

## Workflow

Execute in order.

### Step 1: Load Configuration

Resolve every option CLI flag → project config (`.candid/config.json` →
`improveOutput` field) → user config (`~/.candid/config.json` → `improveOutput`)
→ default. Validation, jq paths, and warning formats are in `CONFIG.md`; invalid
values warn and fall through.

| Option | CLI flag | Config field | Values / default |
|---|---|---|---|
| Mode | `--mode <m>` | `improveOutput.mode` | `auto` \| `review-each` \| `interactive`; default `auto` |
| Iterations | `--iterations <N>` | `improveOutput.iterations` | positive integer; default `1` (single pass) |
| Converge | `--until-converged` | — | loop until a cycle yields no meaningful change; capped by max-iterations |
| Criteria/rubric | `--criteria "<text>"` | — | explicit success bar; loop stops when met |
| Max iterations | `--max-iterations <N>` | `improveOutput.maxIterations` | hard cap for converge/rubric loops; default `5` |
| Source file | `--file <path>` | — | read the artifact from this path |
| Destination | `--out <path>` \| `--in-place` | `improveOutput.defaultDestination` | `chat` \| `file`; default resolved in Step 5 |
| Lenses | — | `improveOutput.lenses` | subset of `intent, completeness, clarity, concision, craft`; default all |

**Stop-condition precedence:** if `--criteria` is set, the rubric is the stop
bar (loop until met or max hit). Else if `--until-converged`, loop until a cycle
is a no-op or max hit. Else run exactly `iterations` cycles (default `1`).

### Step 2: Load Tone Preference

Mirror `candid-review`'s tone loader exactly (see `skills/candid-review/CONFIG.md`).

**Precedence:** CLI (`--harsh`/`--constructive`) → project `tone` → user `tone` → interactive prompt.

If falling through, AskUserQuestion — **Question:** "Choose your critique style"
1. **Harsh** — Blunt about what's weak, vague, or padded. No hedging.
2. **Constructive** — Same honesty, explains *why* each rewrite is stronger and what it trades.

Output: `Using [tone] tone (from [source])`.

### Step 3: Resolve the Target Output

In priority order:

1. `--file <path>` provided → read that file. Record `source = file:<path>`.
2. Inline text passed with the command → use it. Record `source = inline`.
3. Otherwise → the **most recent substantive output in this session** (the default). Identify it explicitly and record `source = session`.

If the target is ambiguous (e.g. several candidate outputs, or no clear recent
one), ask the user which output to improve before proceeding. Never guess
silently.

Echo what you locked onto: `Improving: [one-line description of the artifact] (source: [file|inline|session])`.

### Step 4: Resolve Improvement Criteria

Assemble the bar for "better":

1. **Explicit** — `--criteria "..."` and/or a rubric the user gave.
2. **Context** — the user's prompt in this turn plus relevant session context (what the artifact is for, audience, constraints, length limits).
3. **Inferred** — if neither of the above pins it down, infer the goal from the current session and the artifact itself (the documented default). State your inferred goal in one line so the user can correct it.

Also classify the **artifact type** (copy / doc / answer / plan / prompt / other)
— it selects which lenses matter most in Step 6.

Output: `Goal: [criteria] (from [explicit|context|inferred])`.

### Step 5: Resolve Output Destination

Destination depends on the source (Step 3):

- **Source was a file** → default to writing back. Offer: overwrite in place (`--in-place`), a new file (`--out <path>`), or print to chat. **Confirm before overwriting** (destructive).
- **Source was inline or session** → default to printing the improved output to chat; offer to write to a new file.
- `--out`/`--in-place`/`improveOutput.defaultDestination` override the default without asking.

Record the resolved destination for Step 7.

### Step 6: Run the Refine Loop

Initialize:
```
iteration = 0
current = target output (from Step 3)
history = [current]          # for oscillation checks
```

Loop:

```
WHILE not done:
    iteration++

    6.1 Critique pass — against the Step 4 goal, produce a short list of
        specific, actionable weaknesses. Use the active lenses (Step 1),
        adapted to the artifact type:
          🎯 Intent fit   — does it actually satisfy the goal / answer the ask?
          🧩 Completeness — missing pieces, unsupported claims, gaps?
          🔍 Clarity      — ambiguous, confusing, poorly ordered, jargon?
          ✂️ Concision    — padding, redundancy, filler, hedging?
          🎨 Craft        — tone, correctness, rhythm, polish for the medium
        Each point: one line naming the problem + where it is in the artifact.
        If the artifact already meets the goal and nothing rises above the
        noise floor → mark converged and break.

    6.2 Gate by mode:
          auto        → accept all critique points
          review-each → per-point Yes/No (offer "show the rewrite")
          interactive → per-point: Apply / Skip / Edit-the-goal / Stop-all

    6.3 Refine pass — rewrite `current` into an improved version that addresses
        the accepted points. Change only what the critique justifies; preserve
        the artifact's intent, voice, and any correct content.

    6.4 Show this iteration: the critique points, then a before→after preview
        (full rewrite if short; a diff/section-level view if long).

    6.5 Set current = refined output; append to history.

    6.6 Stop check (see Invariants): stop when the rubric is met, iterations are
        exhausted, the cycle converged, no progress was made, or max-iterations
        is hit.
```

#### Loop Invariants — do not violate

1. **Convergence requires a fresh pass.** Declare "converged/done" only after a critique pass that surfaced nothing meaningful (or the refine produced only trivial change). Never infer convergence from an earlier iteration.
2. **No progress → stop.** If a cycle accepts nothing (or the rewrite is a no-op) and the goal is unmet, stop and report — repeating the identical critique cannot converge.
3. **Oscillation check.** If a refined output matches an earlier entry in `history`, halt: `Oscillation detected — output reverted to iteration [k]`. Surface both versions for the user to choose.
4. **Respect the cap.** `--max-iterations` (default 5) is a hard ceiling for converge/rubric loops. If hit with the goal unmet, stop and report INCOMPLETE.
5. **Single pass by default.** With no `--criteria`, `--until-converged`, or `--iterations`, run exactly one cycle and stop.

### Step 7: Emit Result

1. Deliver `current` to the destination from Step 5:
   - chat → print the final improved output in a fenced block.
   - file → write it; confirm the path (and that a backup/original is preserved when not overwriting).
2. Summary: `[N] iteration(s) · stop reason: [rubric met | converged | iterations done | no progress | max reached]` followed by a 1–3 line note on what changed across the run.

### Step 8: Save State

```bash
mkdir -p .candid
```

Write `.candid/last-improve-output.json`:
```json
{
  "timestamp": "ISO timestamp",
  "skill": "candid-improve",
  "source": "file:<path> | inline | session",
  "goal": "resolved criteria",
  "iterations": 2,
  "stopReason": "converged",
  "destination": "chat | file:<path>"
}
```

Output: `Improvement state saved to .candid/last-improve-output.json`.

**Note:** this file is user-specific state and belongs in `.gitignore` (separate from `candid-improve-implementation`'s `.candid/last-improve.json`).

---

## Output Structure

Per iteration, in order:
1. **Critique** — the active-lens points (🎯/🧩/🔍/✂️/🎨), one line each.
2. **Rewrite** — before→after preview.

After the loop:
3. **Final output** — delivered to the destination.
4. **Summary** — iterations + stop reason + what changed.

In `review-each`/`interactive` modes, the per-point gate (Step 6.2) sits between
Critique and Rewrite.

---

## Examples

```
/candid-improve                                  # refine the last session output, single pass, auto
/candid-improve --file README.md --iterations 2  # two cycles on a file
/candid-improve --until-converged --criteria "punchier, under 120 words, active voice"
/candid-improve --mode interactive --file pitch.md
/candid-improve --harsh --criteria "no marketing fluff, concrete claims only"
```

## Remember

The user already has an output — they want the **next version of it**, aimed at
their goal. Be specific (every critique point names a problem and where), honest
about what each rewrite trades, and restrained (fix what the goal justifies, not
everything you could touch). Default to one pass unless the user asked to loop.
Harsh: name the weak, vague, and padded parts directly. Constructive: same
honesty, explain why each rewrite is stronger.
