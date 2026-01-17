# Team Adoption Guide

How to roll out Candid to your team effectively.

---

## Phase 1: Pilot (1-2 Weeks)

### Select Pilot Users
- Choose 2-3 developers who are open to new tools
- Mix of experience levels (senior + mid-level)
- Include someone who writes standards/style guides

### Setup
1. Install Candid on pilot machines
2. Create a shared `Technical.md` (start minimal, ~15 rules)
3. Use constructive tone initially (less friction)

### Gather Feedback
- What issues did it catch that humans missed?
- What false positives did it flag?
- Which rules in Technical.md need adjustment?

---

## Phase 2: Standards Workshop

### Review Technical.md Together
Schedule a 30-minute meeting to:
1. Walk through current rules
2. Add rules based on recent incidents/bugs
3. Remove rules that are too vague or already handled by linters
4. Get team buy-in (people follow rules they helped write)

### Technical.md Principles
- Only rules you'd block a PR for
- Specific and verifiable, not vague
- Reference linked docs for context, don't explain everything inline

### Example Discussion Points
- "Should we require tests for all new code, or just critical paths?"
- "Do we want to enforce component size limits?"
- "Are there security rules from our last audit to add?"

---

## Phase 3: Team Rollout

### Installation
Share installation instructions (link to getting-started.md):
```bash
/plugin marketplace add ron-myers/candid
/plugin install candid@candid
```

### Shared Configuration
Create a project-level config so everyone uses the same tone:
```bash
mkdir -p .candid
echo '{"tone": "constructive"}' > .candid/config.json
git add .candid/config.json
git commit -m "Add candid config"
```

### Technical.md in Version Control
```bash
git add Technical.md
git commit -m "Add project technical standards"
```

Now everyone reviews against the same rules.

---

## Phase 4: Iterate

### Monthly Standards Review
Add a recurring 15-minute meeting to:
- Review recent 📜 Standards Violations (are rules working?)
- Add rules based on patterns in code reviews
- Remove rules that never get violated (they're either followed or not important)

### Track Effectiveness
Informally note:
- Are reviews catching issues earlier?
- Are fewer bugs making it to production?
- Are developers learning patterns from the feedback?

### Handle Disagreements
When team members disagree on a rule:
1. Document both perspectives
2. Try the rule for 2 weeks
3. Review with data (did it catch real issues?)
4. Decide to keep, modify, or remove

---

## Common Concerns

### "This adds friction to my workflow"
- Start with constructive tone (more supportive)
- Keep Technical.md minimal (fewer false positives)
- Use config files to skip the tone prompt

### "I don't trust AI reviews"
- Candid supplements human reviews, doesn't replace them
- Developers choose which fixes to apply
- Technical.md puts humans in control of the rules

### "Our codebase is special"
- Technical.md exists for exactly this reason
- Add project-specific rules
- Remove generic rules that don't apply

### "What about existing code?"
- Candid only reviews changed code
- Old code gets reviewed as it's touched
- No overwhelming backlog of issues

---

## Metrics to Track

### Leading Indicators
- Time from code complete to PR merged
- Number of review round-trips
- Developer satisfaction with code review process

### Lagging Indicators
- Bugs in production (should decrease)
- Security incidents (should decrease)
- Code consistency across team (should increase)

---

## Templates

### Slack/Teams Announcement
```
Hey team! We're rolling out Candid for AI-assisted code reviews.

What it does:
- Reviews your changes before commit/PR
- Catches security issues, performance problems, and style violations
- Enforces our Technical.md standards

How to start:
1. Install: /plugin install candid@candid
2. Run: /candid-review
3. Questions? Ask in #engineering

This supplements (not replaces) human reviews. You're always in control.
```

### README Section
```markdown
## Code Review

We use [Candid](https://github.com/ron-myers/candid) for AI-assisted code reviews.

Before opening a PR:
1. Run `/candid-review` on your changes
2. Address any 🔥 Critical or ⚠️ Major issues
3. Use your judgment on other issues

Our standards are defined in `Technical.md`.
```
