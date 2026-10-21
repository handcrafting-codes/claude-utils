# Plan usage limits in the Claude Code footer

A Claude Code mod that keeps your plan usage against the 5-hour and 7-day limits always
visible at the right end of the prompt footer, with a countdown to each reset.

```
5h ▰▱▱▱▱▱▱▱ 13% ↻39m   7d ▰▱▱▱▱▱▱▱ 12% ↻6d4h
```

| Part | What it shows |
|---|---|
| `5h` / `7d` | the rolling 5-hour window and the weekly window |
| `▰▱▱▱▱▱▱▱` | 8-cell meter: green < 60%, amber 60–84%, red ≥ 85% |
| `13%` | percent of the window used (one decimal below 10%) |
| `↻39m` | time until that window resets, redrawn every minute |

It also adds `/limits`, which prints the same readings as text.

Readings come from the session's rate-limit data, which Claude Code only has on a claude.ai
subscription login (Pro / Max / Team / Enterprise). On an API-key login there's nothing to
show and the footer stays as it was. The bars appear after the first response of a session.

## Install

From GitHub, inside Claude Code:

```
/plugin marketplace add handcrafting-codes/claude-utils
/plugin install usage-limits@claude-utils
```

Or from a local clone:

```
/plugin marketplace add /path/to/claude-utils
/plugin install usage-limits@claude-utils
```

Restart Claude Code. To update later: `/plugin marketplace update claude-utils`.

## Files

| Path | Role |
|---|---|
| `.claude-plugin/plugin.json` | plugin manifest |
| `hooks/hooks.json` | loads `register.tsx` as the mod module |
| `hooks/register.tsx` | `/limits` command, the footer render, the minute ticker |
| `types/index.d.ts` | the `Limit` shape and the plugin's state typing |
| `tests/limits.test.tsx` | tests |

The marketplace that lists this plugin is `.claude-plugin/marketplace.json` at the repo root.
