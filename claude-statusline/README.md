# Claude Code status line for Salesforce developers

A single-script status line for [Claude Code](https://claude.com/claude-code) that adds a
**wrong-org deploy tripwire** for `sf` CLI users, plus session cost and staleness cues.

```
user@host: ~/repos/my-sfdx-project [main !?] [Fable 5 · high] │ ⚡servicedev │ 42% 85k/200k │ $4.12 +320/-85 │ 1h42m
```

| Segment | What it shows |
|---|---|
| `user@host` | macOS user and machine name |
| `~/repos/…` | Claude Code's current working directory |
| `[main !?]` | git branch + dirty bits: `!` modified, `?` untracked, `+` staged new, `x` deleted, `>` renamed, `*` ahead of remote |
| `[Fable 5 · high]` | model powering the session · reasoning effort |
| `⚡servicedev` | **the default org `sf` commands will hit** — shown only inside an SFDX project. Green when it's your approved sandbox, red for anything else (including `⚡no-org`) |
| `42% 85k/200k` | context-window usage: green < 50%, yellow 50–74%, red ≥ 75% |
| `$4.12 +320/-85` | API-equivalent session cost + lines added/removed by Claude |
| `1h42m` | session wall-clock age |

Segments with no data (no git repo, no SFDX project, no cost yet) disappear instead of
rendering empty.

## Install

From a clone:

```bash
bash claude-statusline/install.sh my-sandbox
```

Or without cloning:

```bash
curl -fsSL https://raw.githubusercontent.com/hangelo/claude-utils/main/claude-statusline/install.sh | bash -s -- my-sandbox
```

`my-sandbox` is the one org alias rendered green; every other target renders red. Omit it
and every org renders red. The installer copies the script to `~/.claude/statusline-command.sh`,
backs up `~/.claude/settings.json` and sets its `statusLine`. Restart Claude Code.

To change the green org later, edit `SAFE_SF_ORG` at the top of the installed script.

For the 5-hour / 7-day usage bars at the right of the footer, see [`usage-limits`](../usage-limits/README.md).

Requires `jq` (`brew install jq`). Everything else is standard macOS/git tooling.

## How the org detection works

The script walks up from the current directory looking for `sfdx-project.json`; when found,
it reads `target-org` from that project's `.sf/config.json`, falling back to
`~/.sf/config.json`. It deliberately reads the JSON directly instead of shelling out to
`sf config get target-org` — the CLI takes seconds to start, far too slow for a status line
that re-renders on every turn.
