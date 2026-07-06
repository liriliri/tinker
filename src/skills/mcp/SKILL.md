---
name: mcp
description: Call Tinker plugin MCP tools from the CLI or wire plugins into MCP clients. Covers listing tool schemas, one-shot tool invocation with tinker call, and stdio MCP servers with tinker mcp. Use when the user asks to call a plugin tool, automate a plugin programmatically, integrate a Tinker plugin with Cursor or Claude Code via MCP, use tinker tools, tinker call, or tinker mcp, or work with plugins marked [mcp] in tinker list.
allowed-tools: Bash(tinker:*)
---

# Tinker MCP

Tinker plugins can expose [Model Context Protocol](https://modelcontextprotocol.io) tools in their `package.json` under `tinker.mcp.tools`. The CLI bridges agents to those tools in two ways: **direct calls** (`tinker call`) and **stdio MCP servers** (`tinker mcp`).

Plugins with MCP support are tagged `[mcp]` in `tinker list`. The plugin **must be running** before any tool call. Open it first with `tinker open <plugin>`.

## The MCP loop

```bash
tinker list                              # find plugins tagged [mcp]
tinker open <plugin>                     # start the plugin window
tinker tools <plugin>                    # inspect tool names and input schemas
tinker call <plugin> --tool <name> [--args '<json-object>']
```

For MCP clients (Cursor, Claude Code, etc.) that spawn a server process, use `tinker mcp <plugin>` instead of `call` for ongoing sessions.

Plugin names accept the short form (`json-editor`) or the full id (`tinker-json-editor`).

## Quickstart

```bash
tinker list
tinker open json-editor
tinker tools json-editor

tinker call json-editor --tool get_json

tinker call json-editor --tool set_json --args '{"content":"{\"hello\":true}"}'

tinker call json-editor --tool format_json
```

## Listing tools

```bash
tinker tools <plugin>
```

Prints the plugin's MCP tool definitions as JSON: names, descriptions, and `inputSchema` for each tool. Run this before the first `call` to learn required argument shapes.

Example tools on `tinker-json-editor`:

| Tool | Purpose |
|------|---------|
| `get_json` | Read current editor content, validation state, mode, line count |
| `set_json` | Replace editor content (`content` string argument) |
| `format_json` | Pretty-print valid JSON |
| `minify_json` | Minify valid JSON |

Tool names and schemas are defined per plugin. Always use `tinker tools <plugin>` for the source of truth.

## Direct tool calls

Best for scripting and one-shot agent actions:

```bash
tinker call <plugin> --tool <name> [--args '<json-object>']
```

- `--args` must be a JSON **object** (default `{}`).
- Results print as plain text or JSON depending on the tool.
- The plugin must already be running (`tinker open <plugin>`).

```bash
tinker open json-editor
tinker call json-editor --tool set_json --args '{"content":"[1,2,3]"}'
tinker call json-editor --tool format_json
tinker call json-editor --tool get_json
```

## Stdio MCP server

For MCP clients that manage their own tool discovery and sessions:

```bash
tinker mcp <plugin>
```

Configure the client to launch `tinker mcp <plugin>` with stdio transport. The server:

1. Fetches tool definitions from the installed plugin package.
2. Exposes them via MCP `listTools`.
3. Forwards `callTool` requests to the **running** plugin over Tinker IPC.

Start the plugin before the MCP client connects:

```bash
tinker open json-editor
# MCP client config or separate terminal:
tinker mcp json-editor
```

If Tinker is not running, start it first (the CLI auto-launches on other commands, but `mcp` needs an active IPC connection).

## Common workflows

### Automate a plugin end to end

```bash
tinker list
tinker open json-editor
tinker tools json-editor
tinker call json-editor --tool set_json --args '{"content":"{\"a\":1}"}'
tinker call json-editor --tool format_json
tinker call json-editor --tool get_json
tinker close json-editor
```

### Wire a plugin into an MCP client

1. Run `tinker list` and pick a plugin tagged `[mcp]`.
2. Add an MCP server entry: command `tinker`, args `["mcp", "<plugin>"]` (short name is fine).
3. Before using tools from the client, open the plugin: `tinker open <plugin>`.
4. Keep Tinker running while the MCP session is active.

### Recover from a stale plugin state

```bash
tinker restart <plugin>
tinker tools <plugin>
tinker call <plugin> --tool <name> --args '{}'
```

## Command reference

| Command | Description |
|---------|-------------|
| `tinker tools <plugin>` | List MCP tools and input schemas |
| `tinker call <plugin> --tool <name> [--args <json>]` | Invoke one MCP tool |
| `tinker mcp <plugin>` | Start stdio MCP server for a plugin |

Supporting lifecycle commands (from the core skill):

| Command | Description |
|---------|-------------|
| `tinker list` | Find plugins tagged `[mcp]` |
| `tinker open <plugin>` | Start plugin (required before tool calls) |
| `tinker ps` | Verify plugin is running |
| `tinker restart <plugin>` | Reset a stuck plugin |

## Troubleshooting

**`Plugin is not running. Please start it first: tinker open <name>`** — Run `tinker open <plugin>` before `call` or before the MCP client invokes tools.

**`<name> does not support MCP`** — The plugin has no `tinker.mcp` tools. Run `tinker list` and choose a `[mcp]` plugin, or automate via the UI instead.

**`Unknown tool "..."`** — Run `tinker tools <plugin>` for valid tool names.

**`Failed to connect to Tinker` / `Tinker is not running`** — Start the Tinker app, then retry. `mcp` and `call` require the main process IPC socket.

**Tool call returns an error string** — Check `--args` matches the tool's `inputSchema` from `tinker tools`. Many tools require specific property names (e.g. `content` for `set_json`).

**MCP client lists tools but calls fail** — The plugin window may have been closed. Run `tinker ps` and `tinker open <plugin>` again.

## Working safely

- MCP tools run inside the user's Tinker session with their data and permissions.
- Do not pass secrets on the command line if shell history matters.
- Read `tinker tools <plugin>` before calling unfamiliar tools; some operations replace or mutate user data immediately.
- Confirm the target plugin with `tinker list` before destructive calls.
