---
command: candid-improve
description: Improve an output — copy, a doc, an answer, a plan, any text — against your goal via a critique→refine loop
skill: candid-improve
args:
  - name: file
    description: Read the artifact to improve from this path (default is the last session output)
    required: false
  - name: criteria
    description: Explicit success bar / rubric — loop until met
    required: false
  - name: iterations
    description: Number of critique→refine cycles (default 1, single pass)
    required: false
  - name: until-converged
    description: Loop until a cycle yields no meaningful improvement (capped by max-iterations)
    required: false
  - name: max-iterations
    description: Hard cap for converge/rubric loops (default 5)
    required: false
  - name: mode
    description: Interaction level (auto, review-each, interactive)
    required: false
  - name: out
    description: Write the improved output to this path
    required: false
  - name: in-place
    description: Overwrite the source file with the improved output
    required: false
  - name: harsh
    description: Use harsh/blunt tone (skips tone prompt)
    required: false
  - name: constructive
    description: Use constructive/supportive tone (skips tone prompt)
    required: false
---

Improve an output you already have — marketing copy, documentation, an answer, a
plan, a prompt, an email — against your goal. Runs a **critique → refine** loop:
name what's weak, rewrite to fix it, repeat until the stop condition is met.

Distinct from `/candid-review` (hunts defects in code) and
`/candid-improve-implementation` (code-quality pass). This is a **generic text
artifact refiner**.

By default it improves the **last output in this session** in a **single pass**,
using the current context to decide what "better" means.

Usage:
```
/candid-improve                                  # refine the last session output, single pass
/candid-improve --file README.md --iterations 2  # two cycles on a file
/candid-improve --until-converged --criteria "punchier, under 120 words, active voice"
/candid-improve --mode interactive --file pitch.md
/candid-improve --harsh --criteria "no marketing fluff, concrete claims only"
/candid-improve --file draft.md --in-place        # overwrite the source (confirmed first)
```

Full workflow, stop conditions, and configuration: the candid-improve skill.
