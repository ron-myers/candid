# Install Candid on Codex CLI

Candid ships as a dual-distribution plugin: the same `skills/` source powers both Claude Code and Codex CLI installs.

## Install

In an interactive Codex CLI session:

```
/plugins
```

Add the marketplace from GitHub shorthand:

```
ron-myers/candid
```

Then install:

```
candid
```

Bundled skills become available immediately. Confirm with:

```
/skills
```

## Invoke

Codex has built-in slash commands (`/plugins`, `/skills`, `/model`, etc.) but no user-definable custom slash commands like Claude Code's `commands/*.md` system. Candid skills are invoked via the `$skill-name` mention syntax or selected from the `/skills` browser.

### Command-to-skill mapping

| Claude Code | Codex CLI |
| --- | --- |
| `/candid-review` | `$candid-review` |
| `/candid-review --harsh` | `$candid-review --harsh` |
| `/candid-review --constructive` | `$candid-review --constructive` |
| `/candid-review --focus security` | `$candid-review --focus security` |
| `/candid-review --re-review` | `$candid-review --re-review` |
| `/candid-ship` | `$candid-ship` |
| `/candid-fast-ship` | `$candid-fast-ship` |
| `/candid-init` | `$candid-init` |
| `/candid-optimize` | `$candid-optimize` |
| `/candid-validate-standards` | `$candid-validate-standards` |
| `/candid-improve` | `$candid-improve` |
| `/candid-improve-implementation` | `$candid-improve-implementation` |
| `/candid-chrome-qa` | `$candid-chrome-qa` |
| `/candid-chrome-qa-fix` | `$candid-chrome-qa-fix` |

All flag and arg syntax (`--harsh`, `--focus security`, `--exclude '*.generated.ts'`, etc.) is identical across both hosts — the skill body parses args the same way.

## Configuration

Candid's project and user config files are unchanged:

- Project: `./.candid/config.json`
- User: `~/.candid/config.json`

The schema, precedence rules, and `Technical.md` lookup work identically on Codex.

## MCP servers (optional)

A few skills (`candid-ship`, `candid-chrome-qa`) integrate with external MCP servers if available:

- **Linear** — for issue tracking integration. Configure in your Codex `config.toml` under `[mcp_servers.linear]`.
- **Claude in Chrome** (browser QA) — `candid-chrome-qa` needs a Chrome-control MCP. If you have one configured under Codex, the skill will use it; otherwise it skips gracefully.

Skills do not require these MCPs to function — they degrade gracefully when missing.

## Subagent dispatch

The `code-reviewer` subagent at `agents/code-reviewer.md` is currently a Claude Code optimization for parallel review of large diffs. On Codex, skills run the review inline. If you regularly review very large diffs on Codex and want parallelism, configure agent threads in your Codex `config.toml`:

```toml
[agents.code-reviewer]
description = "Deep code review for complex multi-domain changes"
```

This is optional — out-of-the-box behavior on Codex is single-threaded review, same logic.

## Update

```
/plugins
```

Reinstall to pull the latest version.

## Uninstall

```
/plugins
```

Remove `candid` from the installed list.
