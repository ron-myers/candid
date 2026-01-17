# Getting Started with Candid

Get running in 5 minutes.

## 1. Install

```bash
# In Claude Code
/plugin marketplace add ron-myers/candid
/plugin install candid@candid
```

Restart Claude Code.

## 2. Run Your First Review

Make some changes to your code, then:

```
/candid-review
```

Candid will:
1. Detect your changes (staged > unstaged > branch diff)
2. Ask for your review style (harsh or constructive)
3. Analyze with architectural context
4. Present categorized issues with fixes
5. Let you choose which fixes to apply

## 3. Set Up Technical.md (Optional but Recommended)

Create project standards that every review enforces:

```
# Use candid-init to generate standards based on your codebase
/candid-init

# Or specify a framework
/candid-init react
/candid-init minimal
```

Edit the generated file to match your project's rules. See [best practices](./Technical-md-best-practices.md).

## 4. Save Your Tone Preference

Skip the tone prompt on every review:

```bash
# Create user-wide config
mkdir -p ~/.candid
echo '{"tone": "harsh"}' > ~/.candid/config.json
```

Or per-project:

```bash
mkdir -p .candid
echo '{"tone": "constructive"}' > .candid/config.json
```

## That's It

You're ready. Run `/candid-review` whenever you want feedback on your changes.

## Next Steps

- [Troubleshooting](./troubleshooting.md) - Common issues and fixes
- [Team Adoption](./team-adoption.md) - Rolling out to your team
- [Technical.md Best Practices](./Technical-md-best-practices.md) - Writing effective standards
- [Example Reviews](./example-reviews/) - See what reviews look like
