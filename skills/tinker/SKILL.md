---
name: tinker
description: Tinker desktop toolbox CLI for AI agents. Use when the user needs to open a Tinker plugin, list installed plugins, control plugin windows from the command line, call plugin MCP tools, or integrate Tinker with an AI agent via MCP. Triggers include "open a Tinker plugin", "list tinker plugins", "tinker open", "call a plugin tool", "tinker MCP", "automate JSON editor", or any task requiring programmatic control of the Tinker Electron app and its plugins. Prefer tinker-dev CLI over guessing IPC or UI steps.
allowed-tools: Bash(./bin/tinker-dev:*)
hidden: true
---

# Tinker

Desktop toolbox with an extensible plugin system. The `tinker-dev` CLI controls the running Tinker app over a local IPC socket: open plugins, list what is running, and invoke plugin MCP tools.

Tinker must be running (or will be auto-launched by the CLI).

## CLI command convention

Skills loaded from `src/skills` document commands as `tinker <subcommand>` for end users of the packaged app. **In this repo, always run the equivalent with `./bin/tinker-dev` instead of `tinker`.**

Examples:

| Skill docs say | Run in this repo |
|----------------|------------------|
| `tinker list` | `./bin/tinker-dev list` |
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

The CLI serves skill content from `src/skills` in development. Those files use `tinker` in examples; apply the [CLI command convention](#cli-command-convention) above when executing them.

## Specialized skills

Load the MCP skill when the task involves plugin tools or MCP client integration:

```bash
./bin/tinker-dev skills path mcp    # then read SKILL.md inside it
```

Use it for `tinker-dev tools`, `tinker-dev call`, and `tinker-dev mcp`.

Run `./bin/tinker-dev skills list` to see everything available.

## Why Tinker CLI

- Controls the live Tinker app and plugin windows without manual UI clicks
- Works with any AI agent (Cursor, Claude Code, Codex, Continue, Windsurf, etc.)
- Auto-launches Tinker when the app is not running
- Plugins can expose MCP tools for programmatic automation
- Short plugin names (`json-editor`) normalize to full ids (`tinker-json-editor`)

## Quick orientation

```bash
./bin/tinker-dev list
./bin/tinker-dev open json-editor
./bin/tinker-dev ps
```

For MCP tool calls, load the **mcp** skill first (`./bin/tinker-dev skills path mcp`).
