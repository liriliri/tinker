---
name: debug
description: Debug Tinker plugins with agent-browser. Use when the user needs to open, inspect, interact with, restart, or close a plugin in the running Tinker Electron app.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(tinker:*)
---

# Tinker Plugin Debug

Debug and interact with Tinker plugins at runtime using `tinker` CLI and `agent-browser` for visual inspection.

## Prerequisites

Open the plugin with `--inspect` so Tinker starts a per-plugin CDP WebSocket. This does **not** enable app-wide `--remote-debugging-port`.

## tinker Commands

```bash
# Open a plugin with CDP inspect (prints ws:// URL)
tinker open <plugin-name> --inspect

# Or pin a port / address
tinker open <plugin-name> --inspect=9222
tinker open <plugin-name> --inspect=127.0.0.1:9222

# Restart with inspect
tinker restart <plugin-name> --inspect

# Close a plugin (also stops its inspect WebSocket server)
tinker close <plugin-name>

# Quit Tinker
tinker quit
```

Example CLI output:

```
Debugger listening on ws://127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83
Open in Chrome: devtools://devtools/bundled/inspector.html?ws=127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83
```

Paste the `devtools://` URL into Chrome's address bar to open DevTools against the plugin.

## Connecting agent-browser

Pass the printed WebSocket URL directly (agent-browser accepts a single `ws://` URL):

```bash
WS=$(tinker open <plugin-name> --inspect | awk '/Debugger listening on/{print $NF}')
agent-browser connect "$WS"
agent-browser snapshot -i
```

Or copy the URL from the `Debugger listening on ...` line:

```bash
agent-browser connect "ws://127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83"
agent-browser snapshot -i
```

For agent-browser interaction commands (click, fill, screenshot, etc.), refer to the agent-browser skill documentation.

## Connection Recovery

If `agent-browser connect` fails, reopen the plugin with inspect:

```bash
tinker close <plugin-name>
tinker open <plugin-name> --inspect
# then agent-browser connect <printed-ws-url>
```

## Notes

- `--inspect` is only on `tinker open` / `tinker restart` (not on `launch`)
- Closing the plugin stops its inspect WebSocket server
- Prefer plugin `--inspect` over `tinker launch --remote-debugging-port` when debugging a single plugin
- If the plugin UI is not ready, wait a moment after `tinker open/restart` before snapshot
