---
command: candid-init
description: Generate a Technical.md file based on your codebase analysis
skill: candid-init
args:
  - name: framework
    description: Target framework (react, node, python, minimal)
    required: false
  - name: output
    description: Output path (default: .candid/Technical.md)
    required: false
  - name: effort
    description: Analysis depth (quick, medium, thorough). Default is thorough.
    required: false
  - name: optimize
    description: Run /candid-optimize after generation with interactive apply
    required: false
  - name: auto-optimize
    description: Run /candid-optimize after generation and apply all recommendations without prompting
    required: false
---

Generate a project-specific Technical.md file by analyzing your codebase.

Usage:
```
/candid-init                    # Auto-detect framework, thorough analysis
/candid-init react              # Generate React-focused standards
/candid-init node               # Generate Node.js-focused standards
/candid-init minimal            # Generate minimal starter standards
/candid-init --effort quick     # Fast analysis (~30 sec)
/candid-init --effort medium    # Balanced analysis (~1-2 min)
/candid-init --effort thorough  # Deep analysis (~3-5 min, default)
/candid-init --output .claude/Technical.md  # Custom output path
/candid-init --optimize         # Run /candid-optimize after generation (interactive)
/candid-init --auto-optimize    # Run /candid-optimize and apply all recommendations
```
