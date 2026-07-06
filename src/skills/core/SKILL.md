---
name: core
description: Core Tinker CLI usage guide. Read this before running any tinker commands. Covers discovering installed plugins, opening and closing plugin windows, listing running plugins, and controlling the Tinker desktop app from the command line. Use when the user asks to open a Tinker plugin, list plugins, check what is running, restart or close a plugin, or quit Tinker.
allowed-tools: Bash(tinker:*)
---

# Tinker core

Tinker is a desktop toolbox built on Electron. Each tool is a **plugin** (for example JSON Editor, RegExp tester). The `tinker` CLI talks to the running Tinker app over a local IPC socket, so agents can open plugins and inspect what is running without clicking the UI.

If Tinker is not running, the CLI **auto-launches** it and retries the command.

For calling plugin MCP tools or wiring plugins into MCP clients, load the **mcp** skill after the basics here.

## The core loop

```bash
tinker list          # 1. See installed plugins
tinker open <plugin> # 2. Open a plugin window
tinker ps            # 3. Confirm it is running
tinker close <plugin> # 4. Close when done
```

Plugin names accept the short form (`json-editor`) or the full id (`tinker-json-editor`). The CLI normalizes to `tinker-<name>` automatically.

## Quickstart

```bash
tinker list
tinker open json-editor
tinker ps
tinker close json-editor
```

`list` output tags plugins as `[builtin]` and `[mcp]` when applicable. Plugins marked `[mcp]` expose programmatic tools; see the **mcp** skill for `tools`, `call`, and `mcp` commands.

## Prerequisites

- **Tinker app** must be installed. The CLI ships with the app (`tinker` on macOS/Linux/Windows).
- Most commands need the main Tinker process. The CLI connects to a Unix socket (macOS/Linux) or named pipe (Windows). Connection errors usually mean Tinker is still starting; wait a moment and retry.

## Discovering plugins

```bash
tinker list
```

Example output:

```
  tinker-json-editor [builtin] [mcp] - JSON editor with text and tree modes
  tinker-regexp [builtin] [mcp] - Regular expression tester
  tinker-hash [builtin] - Hash calculator
```

Use the **id** column (`tinker-json-editor`) or the short name without the prefix (`json-editor`) in other commands.

## Plugin lifecycle

```bash
tinker open <plugin>                              # open in a detached window
tinker open <plugin> --remote-debugging-port 9222   # auto-launch Tinker with CDP (when app was not running)
tinker close <plugin>                               # close a running plugin
tinker restart <plugin>                             # close then open (starts if not running)
tinker quit                                         # quit the Tinker app
```

`open` and `restart` succeed even when the plugin was not running. `close` fails if the plugin is not running.

`ps` lists running plugins with renderer process IDs:

```bash
tinker ps
```

```
  tinker-json-editor 12345
```

## Common workflows

### Open a plugin for the user

```bash
tinker list
tinker open <plugin>
tinker ps
```

### Restart a stuck plugin

```bash
tinker restart <plugin>
tinker ps
```

## Command reference

| Command | Description |
|---------|-------------|
| `tinker list` | List installed plugins |
| `tinker ps` | List running plugins with PIDs |
| `tinker open <plugin>` | Open a plugin window |
| `tinker close <plugin>` | Close a running plugin |
| `tinker restart <plugin>` | Restart a plugin |
| `tinker quit` | Quit Tinker |

## When to load another skill

- **Plugin MCP tools** (`tools`, `call`, `mcp`, MCP client integration): load the **mcp** skill.

## Troubleshooting

**`Failed to connect to Tinker`** — Tinker is not running and auto-launch may have failed. Start the Tinker app manually, then retry.

**`Plugin not found: tinker-...`** — Run `tinker list` and use a valid id or short name. External plugins are installed globally with the `tinker-` npm prefix.

**`Plugin is not running: tinker-...`** — Run `tinker open <plugin>` before `close`.

**Connection timed out** — Tinker may still be starting after auto-launch. Wait a few seconds and retry.

## Working safely

- CLI commands affect the user's live Tinker session and open plugin windows on their desktop.
- Confirm the target plugin with `tinker list` before opening or restarting.
- For programmatic plugin manipulation, load the **mcp** skill and follow its safety notes.
