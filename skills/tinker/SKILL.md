---
name: tinker
description: Tinker desktop toolbox CLI for AI agents. Use when the user needs to open a Tinker plugin, create a new Tinker plugin, list installed plugins, control plugin windows from the command line, call plugin MCP tools, debug a plugin UI, or integrate Tinker with an AI agent via MCP. Triggers include "open a Tinker plugin", "create a Tinker plugin", "list tinker plugins", "tinker open", "call a plugin tool", "tinker MCP", "automate JSON editor", or any task requiring programmatic control of the Tinker Electron app and its plugins. Prefer tinker CLI over guessing IPC or UI steps.
allowed-tools: Bash(tinker:*)
hidden: true
---

# Tinker

Desktop toolbox with an extensible plugin system. The `tinker` CLI controls the running Tinker app over a local IPC socket: open plugins, list what is running, and invoke plugin MCP tools.

Tinker must be running (or will be auto-launched by the CLI).

## Start here

This file is a discovery stub, not the usage guide. Before running `tinker` commands, load the workflow content from the repo:

```bash
tinker skills list
tinker skills path core    # print directory, then read SKILL.md inside it
```

The CLI serves skill content from `src/skills` in development. Those files use `tinker` in examples.

## Specialized skills

Load the matching skill for the task:

```bash
tinker skills path mcp     # tinker tools / call / mcp
tinker skills path create  # scaffold a new plugin from tinker-whois
tinker skills path debug   # inspect/interact with plugin UI via agent-browser
```

- **mcp** — `tinker tools`, `tinker call`, and `tinker mcp`
- **create** — clone the whois template, build, `npm link`, and open in Tinker
- **debug** — `tinker open` / `restart` / `close` plus `agent-browser` on CDP 9222

Run `tinker skills list` to see everything available.

## Why Tinker CLI

- Controls the live Tinker app and plugin windows without manual UI clicks
- Works with any AI agent (Cursor, Claude Code, Codex, Continue, Windsurf, etc.)
- Auto-launches Tinker when the app is not running
- Plugins can expose MCP tools for programmatic automation
- Short plugin names (`json-editor`) normalize to full ids (`tinker-json-editor`)

## Quick orientation

```bash
tinker list
tinker open json-editor
tinker ps
```

For MCP tool calls, load the **mcp** skill first (`tinker skills path mcp`).
For a new plugin, load the **create** skill (`tinker skills path create`).

## Troubleshooting

If `tinker` command fails (command not found, connection refused, etc.), the Tinker desktop app is not installed or the CLI tool is not set up:

1. Download and install Tinker from **[https://tinker.liriliri.io/](https://tinker.liriliri.io/)**
2. Open Tinker, right-click the tray icon, and select "安装命令行工具" to install the CLI
3. Verify with `tinker ps`
