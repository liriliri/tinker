---
name: debug
description: Debug Tinker plugins with agent-browser. Use when the user needs to open, inspect, interact with, restart, or close a plugin in the running Tinker Electron app.
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(tinker:*)
---

# Tinker Plugin Debug

Debug and interact with Tinker plugins at runtime using `tinker` CLI and `agent-browser` for visual inspection.

## Prerequisites

Tinker must be running with `--remote-debugging-port=9222`. The `--inspect` port is for Node.js main process debugging only and does NOT expose renderer pages.

If remote debugging is not enabled, open or restart the plugin with the flag (see Connection Recovery).

## tinker Commands

```bash
# Open a plugin
tinker open <plugin-name>

# Restart a plugin (also starts if not running)
tinker restart <plugin-name>

# Close a plugin
tinker close <plugin-name>

# Quit Tinker
tinker quit
```

## Connecting agent-browser

After opening a plugin, connect to CDP port 9222:

```bash
agent-browser connect 9222
agent-browser tab
# Switch to the plugin://tinker-<name>/index.html tab
agent-browser tab t2
agent-browser snapshot -i
```

For agent-browser interaction commands (click, fill, screenshot, etc.), refer to the agent-browser skill documentation.

## Tab Selection Tips

- The plugin hosting window tab shows `http://localhost:8080/?page=plugin` (this is the outer shell, not the plugin content)
- The actual plugin content is in the `plugin://tinker-<name>/index.html` tab
- Always switch to the `plugin://` tab before running snapshot or interact commands

## Connection Recovery

If `agent-browser connect 9222` fails with "Connection refused", restart Tinker with remote debugging enabled:

```bash
tinker quit
tinker open <plugin-name> --remote-debugging-port=9222
```

Then retry connecting:

```bash
agent-browser connect 9222
```

## Notes

- If the plugin tab doesn't appear, wait a moment after `tinker open/restart` for the page to load
