---
name: core
description: Core Tinker CLI usage guide. Read this before running any tinker commands. Covers discovering installed plugins, opening and closing plugin windows, listing running plugins, launching and quitting the Tinker desktop app from the command line. Use when this skill is loaded for any user goal that might map to a Tinker plugin, or when the user asks to open a Tinker plugin, list plugins, check what is running, restart or close a plugin, launch or quit Tinker.
allowed-tools: Bash(tinker:*)
---

# Tinker core

Tinker is a desktop **toolbox**. Each tool is a **plugin**. The `tinker` CLI talks to the running app over a local IPC socket. If Tinker is not running, the CLI **auto-launches** it and retries.

**When this skill is in context**, treat the user's request as potentially solvable by an installed plugin. Check the catalog before writing a one-off script.

For MCP tools → **mcp** skill. For window automation without MCP → **ui** skill.

## Discover and open

**Do not run bare `tinker list` for discovery** — the full catalog is long and agent output often truncates.

```bash
tinker list --short              # all short names on one line
tinker list <plugin>…            # details for candidates (tags + description)
tinker open <plugin>
tinker ps
tinker close <plugin>            # when done
```

Skip discovery if the user already named the plugin. Names accept short form (`json-editor`) or full id (`tinker-json-editor`); the CLI normalizes to `tinker-<name>`.

Scoped npm plugins (e.g. `@tencent/tinker-wxapkg`) appear as ids like `tencent-tinker-wxapkg`. Use the **full id** from `list` (or the `@scope/...` package name) — short names such as `wxapkg` will not resolve.

Detail lines look like:

```
  tinker-json-editor [builtin] [mcp] - JSON editor with text and tree modes
  tinker-hash [builtin] - Hash calculator
```

Tags: `[builtin]`, `[mcp]` (programmatic tools — see **mcp**), `[background]` (**Run in Background** enabled; required for `open --headless`).

## Plugin lifecycle

```bash
tinker open <plugin>                              # detached window
tinker open <plugin> --headless                   # no window (needs Run in Background)
tinker open <plugin> --inspect                    # per-plugin CDP (see **debug**)
tinker close <plugin>
tinker restart <plugin>                           # close then open (starts if needed)
tinker restart <plugin> --inspect
tinker launch                                     # start the Tinker app
tinker launch --remote-debugging-port 9222        # app-wide CDP (see **debug**)
tinker launch --http                              # HTTP remote viewer (see **debug**)
tinker quit
```

`open` / `restart` succeed even when the plugin was not running. `close` fails if it is not running.

`--headless` requires **Run in Background** (right-click the plugin → checkbox); otherwise open fails.

Prefer plugin `--inspect` over app-wide `launch --remote-debugging-port` for single-plugin debugging. If Tinker is already running, quit before relaunching with `--http` / `--remote-debugging-port`.

```bash
tinker ps                    # running plugins + renderer PIDs
tinker restart <plugin>      # stuck plugin
```

## Plugin data

Backup, restore, or wipe a plugin's localStorage / IndexedDB. The plugin **must be running**. No dialogs; import overwrites; `clear` requires `--yes`.

```bash
tinker open json-editor
tinker data export json-editor ./backup.zip
tinker data import json-editor ./backup.zip
tinker data clear json-editor --yes
```

## Prerequisites

- Tinker app installed; CLI ships with the app (`tinker` on macOS/Linux/Windows).
- Most commands need the main process. Connection errors usually mean Tinker is still starting — wait and retry.

## Command reference

| Command | Description |
|---------|-------------|
| `tinker list --short` | Short names on one line (no `tinker-` prefix) |
| `tinker list <plugin>…` | Details for one or more plugins |
| `tinker list` | Full catalog (avoid for agents; may truncate) |
| `tinker ps` | Running plugins with PIDs |
| `tinker open <plugin>` | Open plugin window |
| `tinker open <plugin> --headless` | Background open (no window) |
| `tinker open <plugin> --inspect` | Per-plugin CDP (see **debug**) |
| `tinker close / restart <plugin>` | Close or restart |
| `tinker launch` | Launch Tinker |
| `tinker launch --remote-debugging-port / --http …` | App-wide debug/viewer (see **debug**) |
| `tinker quit` | Quit Tinker |
| `tinker ui <plugin> …` | Automate plugin UI (see **ui**) |
| `tinker data …` | Export / import / clear plugin data |

## When to load another skill

- **create** — scaffold a standalone plugin
- **mcp** — `tools` / `call` / `mcp`
- **ui** — `tinker ui` snapshot/click/fill (no MCP)
- **debug** — `--inspect`, Chrome DevTools, agent-browser, `--http`

## Troubleshooting

**`Failed to connect to Tinker`** — Start with `tinker launch`, then retry.

**`Plugin not found: tinker-...`** — `tinker list --short`, then `tinker list <plugin>`. External plugins use the global `tinker-` npm prefix.

**`Plugin is not running: tinker-...`** — `tinker open <plugin>` before `close`, `call`, `ui`, or `data`.

**`Plugin does not allow running in background`** — Enable **Run in Background** before `--headless`.

**Connection timed out** — Wait a few seconds after auto-launch and retry.

## Working safely

CLI commands affect the user's live Tinker session and open windows on their desktop. Confirm the target with `list --short` / `list <plugin>` before opening or restarting.
