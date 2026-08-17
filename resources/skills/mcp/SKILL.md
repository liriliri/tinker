---
name: mcp
description: Call Tinker plugin MCP tools from the CLI or wire plugins into MCP clients. Covers listing tool schemas, one-shot tool invocation with tinker call, and stdio MCP servers with tinker mcp. When a plugin has no MCP tools, fall back to the ui skill (tinker ui snapshot/click/fill). Use when the user asks to call a plugin tool, automate a plugin programmatically, integrate a Tinker plugin with Cursor or Claude Code via MCP, use tinker tools, tinker call, or tinker mcp, or work with plugins tagged [mcp].
allowed-tools: Bash(tinker:*)
---

# Tinker MCP

Plugins can expose [MCP](https://modelcontextprotocol.io) tools via `tinker.mcp.tools` in `package.json`. The CLI bridges them with **`tinker call`** (one-shot) and **`tinker mcp`** (stdio server for clients).

Plugins with MCP are tagged `[mcp]` in `tinker list <plugin>` output. The plugin **must be running** before any tool call (`tinker open <plugin>`).

No `[mcp]` tag → no `tools` / `call` API. Use the **ui** skill instead (see [When MCP is not available](#when-mcp-is-not-available)).

## The MCP loop

```bash
tinker list --short
tinker list <plugin>…                    # confirm [mcp]
tinker open <plugin>
tinker tools <plugin>                    # names + inputSchema (source of truth)
tinker call <plugin> --tool <name> [--args '<json-object>']
```

For MCP clients that spawn a server process, use `tinker mcp <plugin>` instead of `call`.

## Direct tool calls

```bash
tinker open json-editor
tinker tools json-editor
tinker call json-editor --tool get
tinker call json-editor --tool set --args '{"content":"{\"hello\":true}"}'
tinker call json-editor --tool format
```

- `--args` must be a JSON **object** (default `{}`).
- Results print as plain text or JSON depending on the tool.
- Always run `tinker tools <plugin>` before the first `call` on an unfamiliar plugin.

## Stdio MCP server

```bash
tinker open json-editor
# MCP client config: command `tinker`, args `["mcp", "json-editor"]`
tinker mcp json-editor
```

The server fetches tool definitions from the plugin package, exposes them via `listTools`, and forwards `callTool` to the **running** plugin over IPC.

`mcp` needs an active IPC connection (auto-launch may not cover it — start Tinker first if needed). Keep the plugin open while the client session is active.

### Wire into an MCP client

1. `tinker list --short` / `tinker list <plugin>` — pick a `[mcp]` plugin.
2. Client config: command `tinker`, args `["mcp", "<plugin>"]`.
3. Before tools are used: `tinker open <plugin>`.
4. Keep Tinker running for the session.

### Recover from stale state

```bash
tinker restart <plugin>
tinker tools <plugin>
tinker call <plugin> --tool <name> --args '{}'
```

## When MCP is not available

| Situation | Approach |
|-----------|----------|
| Plugin tagged `[mcp]` | `tinker tools` / `call` / `mcp` |
| No `[mcp]` or "does not support MCP" | **ui**: `tinker open` + `tinker ui` snapshot/click/fill |
| Raw CDP / DevTools / agent-browser | **debug**: `tinker open --inspect` |
| Need stable schema-defined automation | Add MCP tools, or use an `[mcp]` plugin |

```bash
tinker skills path ui
tinker open <plugin>
tinker ui <plugin> snapshot --inline
```

## Command reference

| Command | Description |
|---------|-------------|
| `tinker tools <plugin>` | List MCP tools and input schemas |
| `tinker call <plugin> --tool <name> [--args <json>]` | Invoke one MCP tool |
| `tinker mcp <plugin>` | Stdio MCP server for a plugin |

Lifecycle (`list` / `open` / `ps` / `restart`): see **core**.

## Troubleshooting

**`Plugin is not running...`** — `tinker open <plugin>` before `call` or before the client invokes tools.

**`does not support MCP`** — Pick a `[mcp]` plugin, or use **ui**.

**`Unknown tool "..."`** — Run `tinker tools <plugin>`.

**`Failed to connect` / `Tinker is not running`** — Start Tinker; `mcp` and `call` need the IPC socket.

**Tool returns an error string** — Match `--args` to `inputSchema` from `tinker tools`.

**Client lists tools but calls fail** — Plugin may have closed; `tinker ps` and `tinker open <plugin>` again.

## Working safely

MCP tools run in the user's Tinker session with their data. Read `tinker tools` before unfamiliar calls — some mutate data immediately. Do not put secrets on the command line if shell history matters.
