---
command: candid-improve-implementation
description: Review the implementation for approach/clarity/quality improvements - "the code works, what would the next version look like?"
skill: candid-improve-implementation
args:
  - name: harsh
    description: Use harsh/brutal tone (skips tone prompt)
    required: false
  - name: constructive
    description: Use constructive/supportive tone (skips tone prompt)
    required: false
  - name: focus
    description: Focus on a single area (approach, clarity, quality)
    required: false
  - name: exclude
    description: Exclude files matching pattern (can be repeated)
    required: false
  - name: no-bugs
    description: Suppress the "Bugs" section (defects route to /candid-review)
    required: false
  - name: auto-commit
    description: Automatically create a git commit after applying suggestions
    required: false
---

Review the current implementation through the **improvement** lens — what would the next version of this code look like if we built it again with what we know now?

Distinct from `/candid-review` (which hunts defects, security holes, edge cases). This skill surfaces opportunities to improve approach, clarity, and quality.

Usage:
```
/candid-improve-implementation                          # Interactive tone selection
/candid-improve-implementation --harsh                  # Brutal honesty
/candid-improve-implementation --constructive           # Supportive
/candid-improve-implementation --focus approach         # Design / decomposition only
/candid-improve-implementation --focus clarity          # Naming, control flow, abstraction
/candid-improve-implementation --focus quality          # Idioms, dead code, testability
/candid-improve-implementation --no-bugs                # Suppress bug section
/candid-improve-implementation --exclude "*.generated.ts"
/candid-improve-implementation --auto-commit            # Commit applied suggestions
```

Full workflow, output format, and configuration: the candid-improve-implementation skill.
