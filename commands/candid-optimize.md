---
command: candid-optimize
description: Audit and optimize the context candid loads during reviews — Technical.md efficiency, exclude patterns, decision register, and config tuning
skill: candid-optimize
args:
  - name: dry-run
    description: Show recommendations without applying changes
    required: false
  - name: apply-all
    description: Apply all optimizations without prompting
    required: false
  - name: section
    description: Only analyze a specific section (technical-md, excludes, register, config)
    required: false
---

Audit and optimize the context that candid loads during code reviews.

Usage:
```
/candid-optimize                          # Full audit with interactive apply
/candid-optimize --dry-run                # Show recommendations only
/candid-optimize --apply-all              # Apply all optimizations
/candid-optimize --section technical-md   # Only analyze Technical.md
/candid-optimize --section excludes       # Only analyze exclude patterns
/candid-optimize --section register       # Only analyze decision register
/candid-optimize --section config         # Only analyze config tuning
```

The audit covers:
1. **Token budget estimation** — breakdown of what consumes context during reviews
2. **Technical.md efficiency** — verbose rules, near-duplicates, low-signal rules
3. **Exclude patterns** — generated files, build output, lock files missing from exclusions
4. **Decision register** — size, mode optimization, pruning old entries
5. **Config tuning** — missing config, branch targets, focus mode suggestions
