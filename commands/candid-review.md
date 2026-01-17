---
command: candid-review
description: Run a configurable code review with radical candor - choose harsh or constructive tone
skill: candid-review
args:
  - name: harsh
    description: Use harsh/brutal tone (skips tone prompt)
    required: false
  - name: constructive
    description: Use constructive/supportive tone (skips tone prompt)
    required: false
  - name: focus
    description: Focus on specific area (security, performance, architecture)
    required: false
  - name: exclude
    description: Exclude files matching pattern (can be repeated)
    required: false
  - name: re-review
    description: Compare against previous review to show fixed/remaining/new issues
    required: false
  - name: commit
    description: Automatically create git commit after applying fixes with detailed message listing all changes
    required: false
---

Run a code review on your current changes with configurable tone and focus.

Usage:
```
/candid-review                           # Interactive tone selection
/candid-review --harsh                   # Brutal honesty mode
/candid-review --constructive            # Supportive feedback mode
/candid-review --focus security          # Security-focused review
/candid-review --focus performance       # Performance-focused review
/candid-review --exclude "*.generated.ts"  # Exclude patterns
/candid-review --re-review               # Compare to previous review
```

The review will:
1. Detect your changes (staged > unstaged > branch diff)
2. Load Technical.md standards (if present)
3. Analyze with architectural context
4. Present categorized issues with fixes
5. Let you choose which fixes to apply
6. Save review state for future comparisons
