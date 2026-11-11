# Spinner verbs with gray glosses

A `spinnerVerbs` setting for [Claude Code](https://claude.com/claude-code) that replaces the
built-in spinner verbs with the same 184 verbs, each followed by a short plain-English gloss
in dim gray:

```
✻ Ruminating (chewing it over)…
```

The gloss is wrapped in ANSI escapes (`\u001b[90m` … `\u001b[39m`: bright-black foreground,
then default foreground). They are stored as JSON escapes in
[`spinner-verbs-gray.json`](spinner-verbs-gray.json) and must stay that way; a merge that
writes them out as literal `[90m` text or strips them breaks the colouring.

## Install

Requires `jq` (`brew install jq`). From the repo root:

```bash
cp ~/.claude/settings.json ~/.claude/settings.json.bak
jq --slurpfile v spinner-verbs/spinner-verbs-gray.json '.spinnerVerbs = $v[0].spinnerVerbs' \
  ~/.claude/settings.json.bak > ~/.claude/settings.json
```

This overwrites only the top-level `spinnerVerbs` key; every other key (permissions, hooks,
env, …) is carried over unchanged. Restart Claude Code.

Verify:

```bash
jq empty ~/.claude/settings.json && echo valid
jq '.spinnerVerbs.verbs | length' ~/.claude/settings.json   # 184
grep -c '\\u001b\[90m' ~/.claude/settings.json               # ≥ 1
```

To undo, restore `~/.claude/settings.json.bak`, or `jq 'del(.spinnerVerbs)'` to fall back
to the built-in verbs.

## Install via Claude Code

Paste this prompt into a session started in this repo:

> Merge the spinnerVerbs block from spinner-verbs/spinner-verbs-gray.json into my user-level
> ~/.claude/settings.json.
>
> Requirements:
> - Back up ~/.claude/settings.json to ~/.claude/settings.json.bak first.
> - Overwrite only the top-level "spinnerVerbs" key. Preserve every other key, including
>   permissions, hooks and env, exactly as they are.
> - Keep mode "replace" and the verbs array as-is. Each verb contains ANSI escapes written as
>   the JSON sequences \u001b[90m and \u001b[39m. They must stay as JSON escapes in the file,
>   never as literal "[90m" text and never stripped.
> - Use jq or a JSON-aware tool for the merge. Do not hand-edit the file.
> - Afterwards, validate the file with jq empty, confirm the verbs array has 184 entries, and
>   confirm the first entry still contains \u001b[90m (grep for it in the raw file).
> - Report only: backup path, entry count, and validation result. No summary of what you did.

## Customising

`mode` is `"replace"` (only these verbs) or `"append"` (these plus the built-ins). To change
the gloss colour, swap `90` for another SGR foreground code, e.g. `36` (cyan) or `33`
(yellow). The closing `39` resets only the foreground, so stick to plain colour codes.
