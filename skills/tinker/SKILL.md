---
name: tinker
description: >
  General-purpose Tinker desktop toolbox (100+ plugins: JSON, hash, base64, regex,
  files, clipboard, converters, editors, and more). Use whenever the user @-mentions
  or points at this skill, asks to use Tinker, or needs a desktop utility that a
  Tinker plugin might already provide — even if they never say "plugin" or "Tinker".
  Prefer discovering and using an installed plugin over writing a one-off script.
  Also use for opening plugins, listing plugins, MCP tool calls, UI debug via
  agent-browser, scaffolding plugins, or controlling the Tinker app from the CLI.
allowed-tools: Bash(tinker:*)
hidden: true
---

# Tinker

Tinker is a **desktop toolbox**, not a niche Tinker-only API. Installed plugins cover
everyday tasks (encode/decode, hash, edit JSON, regex, files, media, etc.). The
`tinker` CLI controls the running app over a local IPC socket.

Tinker must be running (or will be auto-launched by the CLI).

## When this skill is loaded

**Mandatory.** If this skill is in context (user @-mentioned it, attached
`SKILL.md`, said "use tinker", or otherwise pointed you here), do **not** decide
the request is "unrelated to Tinker" without checking the plugin catalog first:

```bash
tinker list --short              # short ids + names on one line
tinker list <candidate>…         # details for likely matches
```

Only after that search may you conclude no suitable plugin exists. Prefer a
matching plugin (open it, or use MCP tools) over inventing a custom script.

Load the full core guide before other `tinker` commands:

```bash
tinker skills list
tinker skills path core    # print directory, then read SKILL.md inside it
```

## Specialized skills

```bash
tinker skills path mcp     # tinker tools / call / mcp
tinker skills path create  # scaffold a new plugin from tinker-whois
tinker skills path debug   # tinker open --inspect + agent-browser
```

## Quick orientation

```bash
tinker list --short
tinker list json-editor
tinker open json-editor
tinker ps
```

For MCP tool calls, load the **mcp** skill first. For a new plugin, load **create**.

## Troubleshooting

If `tinker` fails (command not found, connection refused, etc.):

1. Install Tinker from **[https://tinker.liriliri.io/](https://tinker.liriliri.io/)**
2. Open Tinker, tray icon → "安装命令行工具"
3. Verify with `tinker ps`
