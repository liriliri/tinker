---
name: tinker-dev
description: >
  Tinker development CLI for the tinker repo. Tinker is a general desktop toolbox
  with many plugins — use whenever this skill is @-mentioned or the user asks to
  use Tinker/tinker-dev, and always check whether an installed plugin covers the
  request before treating it as unrelated. Controls plugins via `./bin/tinker-dev`
  (open, list, MCP tools). Do not use the packaged `tinker` CLI in this repo.
allowed-tools: Bash(./bin/tinker-dev:*)
hidden: true
---

# Tinker Dev

Desktop toolbox with an extensible plugin system. The `tinker-dev` CLI controls the running Tinker app over a local IPC socket: open plugins, list what is running, and invoke plugin MCP tools.

This skill is for **development in the tinker repo**. The global `tinker` skill covers the packaged `tinker` CLI for end users.

Tinker must be running (or will be auto-launched by the CLI).

## When this skill is loaded

**Mandatory.** If this skill is in context, do not skip Tinker because the task
"does not sound like a plugin". Discover first:

```bash
./bin/tinker-dev list --short
./bin/tinker-dev list <candidate>…
```

Prefer a matching plugin over a custom script when one exists.

## CLI command convention

Skills loaded from `resources/skills` document commands as `tinker <subcommand>` for end users of the packaged app. **In this repo, always run the equivalent with `./bin/tinker-dev` instead of `tinker`.**

Examples:

| Skill docs say | Run in this repo |
|----------------|------------------|
| `tinker list` | `./bin/tinker-dev list` |
| `tinker list --short` | `./bin/tinker-dev list --short` |
| `tinker open json-editor` | `./bin/tinker-dev open json-editor` |
| `tinker call …` | `./bin/tinker-dev call …` |
| `tinker mcp …` | `./bin/tinker-dev mcp …` |

Do not invoke the packaged `tinker` binary while working in the development tree.

## Start here

This file is a discovery stub, not the usage guide. Before running `tinker-dev` commands, load the workflow content from the repo:

```bash
./bin/tinker-dev skills list
./bin/tinker-dev skills path core    # print directory, then read SKILL.md inside it
```

The CLI serves skill content from `resources/skills`. Those files use `tinker` in examples; apply the [CLI command convention](#cli-command-convention) above when executing them.

## Specialized skills

Load the matching skill for the task:

```bash
./bin/tinker-dev skills path mcp     # tools / call / mcp
./bin/tinker-dev skills path debug   # --inspect + agent-browser
./bin/tinker-dev skills path create  # scaffold a new plugin
```

Use **mcp** for `tinker-dev tools` / `call` / `mcp`. Use **debug** for UI automation via `agent-browser`.

Run `./bin/tinker-dev skills list` to see everything available.

## Quick orientation

```bash
./bin/tinker-dev list --short
./bin/tinker-dev list json-editor
./bin/tinker-dev open json-editor
./bin/tinker-dev ps
```

For MCP tool calls, load the **mcp** skill first (`./bin/tinker-dev skills path mcp`).
