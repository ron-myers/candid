---
command: candid-validate-standards
description: Validate your Technical.md for vague rules and linter overlaps
skill: candid-validate-standards
args:
  - name: path
    description: Path to Technical.md (default: ./Technical.md or .claude/Technical.md)
    required: false
  - name: fix
    description: Suggest specific rewrites for vague rules
    required: false
---

Validate your Technical.md file for effectiveness.

Usage:
```
/candid-validate-standards              # Validate default Technical.md location
/candid-validate-standards path/to/Technical.md  # Validate specific file
/candid-validate-standards --fix        # Include suggested rewrites
```

Checks for:
- Vague rules that can't be verified ("write clean code")
- Rules that duplicate what linters already check
- Rules without clear boundaries or thresholds
- Overly complex rules that span multiple concerns
