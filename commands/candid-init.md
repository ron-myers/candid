---
command: candid-init
description: Generate a Technical.md file based on your codebase analysis
skill: candid-init
args:
  - name: framework
    description: Target framework (react, node, python, minimal)
    required: false
  - name: output
    description: Output path (default: ./Technical.md)
    required: false
---

Generate a project-specific Technical.md file by analyzing your codebase.

Usage:
```
/candid-init                    # Auto-detect framework, create Technical.md
/candid-init react              # Generate React-focused standards
/candid-init node               # Generate Node.js-focused standards
/candid-init minimal            # Generate minimal starter standards
/candid-init --output .claude/Technical.md  # Custom output path
```
