---
name: debug
description: Debug Tinker plugins with CDP inspect, app-wide remote debugging, the HTTP remote viewer, and optional agent-browser. Prefer the ui skill (tinker ui) for everyday plugin UI automation. Use this skill when you need open --inspect, launch --remote-debugging-port, launch --http, Chrome DevTools, or an external CDP client.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(tinker:*)
---

# Tinker Plugin Debug

Low-level CDP debugging for Tinker plugins. For normal agent UI automation (snapshot / click / fill), prefer the **ui** skill (`tinker ui`) — no extra install required.

Use this skill for the raw inspect WebSocket, Chrome DevTools, `agent-browser`, app-wide `--remote-debugging-port`, or the `--http` remote viewer.

## Per-plugin inspect

Open the plugin with `--inspect` so Tinker starts a **per-plugin** CDP WebSocket. Only that plugin page is exposed.

```bash
tinker open <plugin> --inspect
tinker open <plugin> --inspect=9222
tinker open <plugin> --inspect=127.0.0.1:9222
tinker restart <plugin> --inspect
tinker close <plugin>              # also stops its inspect WebSocket
```

Example CLI output:

```
Debugger listening on ws://127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83
Open in Chrome: devtools://devtools/bundled/inspector.html?ws=127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83
```

Paste the `devtools://` URL into Chrome to open DevTools against the plugin.

`--inspect` is only on `open` / `restart` (not on `launch`). Prefer it over app-wide debugging when working on a single plugin.

`tinker ui` auto-starts inspect and will disconnect other CDP clients on the same plugin — don't mix `ui` and agent-browser on one plugin.

## App-wide debugging and HTTP viewer

These flags are only on `tinker launch`. If Tinker is already running, quit first, then relaunch:

```bash
tinker quit
tinker launch --remote-debugging-port 9222
tinker launch --http                              # viewer for running plugins
tinker launch --http=127.0.0.1:9223
tinker launch --http --http-username user --http-password secret
```

`--http` starts an HTTP remote viewer (same argv pattern as `--remote-debugging-port`). Open the address in a browser to list **running** plugins and view/interact with them (CDP screencast). Plugins that are not open cannot be accessed or started from this UI.

With `--http-username` (and optional `--http-password`), the viewer requires HTTP Basic Auth. Requests without credentials show a username/password form on the list page. API and WebSocket access require valid credentials.

## Connecting agent-browser

Pass the printed WebSocket URL directly:

```bash
WS=$(tinker open <plugin> --inspect | awk '/Debugger listening on/{print $NF}')
agent-browser connect "$WS"
agent-browser snapshot -i
```

Or copy the URL from the `Debugger listening on ...` line:

```bash
agent-browser connect "ws://127.0.0.1:57104/ed7bc332-316d-45ce-996a-1c3f6f22ac83"
agent-browser snapshot -i
```

After connect, `agent-browser tab` should show a single `plugin://tinker-<name>/...` tab. No tab switching is needed.

For interaction commands (click, fill, screenshot, etc.), refer to the agent-browser skill documentation.

## Connection recovery

If `agent-browser connect` fails or lands on `about:blank`:

```bash
tinker close <plugin>
tinker open <plugin> --inspect
# then agent-browser connect <printed-ws-url>
```

If the plugin UI is not ready, wait a moment after `open` / `restart` before snapshot.
