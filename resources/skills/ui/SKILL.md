---
name: ui
description: Automate a running Tinker plugin window with tinker ui (snapshot/click/fill). Prefer this over agent-browser when a plugin has no MCP tools. Use when the user asks to click, fill, or snapshot a plugin UI, or when MCP tools are unavailable.
allowed-tools: Bash(tinker:*)
---

# Tinker UI automation

Drive a **running** plugin window with the same protocol as [playwright-cli](https://playwright.dev/agent-cli/introduction): aria snapshots, ephemeral `eN` refs, click/fill/… — no `agent-browser` install.

The plugin must already be open (`tinker open <plugin>`). The first `tinker ui` call auto-starts per-plugin CDP inspect if needed.

Prefer **`tinker call`** when the plugin is tagged `[mcp]`. Prefer **debug** (`open --inspect` + agent-browser) only for raw CDP / DevTools. Full decision table: **mcp** skill → *When MCP is not available*.

## The UI loop

```bash
tinker open <plugin>
tinker ui <plugin> snapshot --inline
# pick a ref (eN) from the snapshot
tinker ui <plugin> click e12
tinker ui <plugin> fill e5 "hello"
tinker ui <plugin> snapshot --inline   # refs invalidate after DOM changes
```

Prefer **`snapshot --inline`** so the agent reads YAML from stdout. After any DOM change, snapshot again before reusing refs.

## Snapshot / find

```bash
tinker ui <plugin> snapshot --inline
tinker ui <plugin> snapshot                 # auto-save under the plugin UI data dir
tinker ui <plugin> snapshot --depth=4
tinker ui <plugin> snapshot e34             # subtree at a ref
tinker ui <plugin> snapshot "#main"
tinker ui <plugin> snapshot --boxes
tinker ui <plugin> find "Save"
tinker ui <plugin> find --regex "/sign (in|up)/i"
```

File outputs (`snapshot --filename`, `screenshot --filename`) must stay under the plugin UI data root (e.g. `…/data/ui/tinker-<plugin>/`). Paths like `/tmp/...` are rejected.

## Targeting

Prefer refs from the **latest** snapshot. CSS or Playwright locators also work:

```bash
tinker ui <plugin> click "#main > button.submit"
tinker ui <plugin> click "getByRole('button', { name: 'Submit' })"
```

## Core actions

```bash
tinker ui <plugin> click <ref>
tinker ui <plugin> dblclick <ref>
tinker ui <plugin> fill <ref> <text>           # prefer this to change a field
tinker ui <plugin> fill <ref> <text> --submit
tinker ui <plugin> type <text>                 # focused element only
tinker ui <plugin> press <key>
tinker ui <plugin> hover <ref>
tinker ui <plugin> select <ref> <value>
tinker ui <plugin> check <ref>
tinker ui <plugin> uncheck <ref>
tinker ui <plugin> screenshot [--full-page] [--hires]
tinker ui <plugin> screenshot e5
tinker ui <plugin> eval "document.title"
tinker ui <plugin> eval "el => el.textContent" e5
tinker ui <plugin> video-start /abs/path/out.webm
tinker ui <plugin> video-stop
```

**`fill` vs `type`:** use `fill <ref> …` for a specific input; use `type` only when focus is already correct.

`video-start` records the plugin window and overlays a mouse pointer that follows click/hover. Pass `--cursor=none` to record without the pointer.

Less common: `drag`, `drop`, `upload`, `dialog-accept` / `dialog-dismiss`, `keydown` / `keyup`, `mousemove` / `mousewheel`, `reload`, `resize`, `highlight`, `generate-locator`, `run-code`.

## Debug helpers

```bash
tinker ui <plugin> console
tinker ui <plugin> requests
tinker ui <plugin> request 5
```

Unknown actions print the full supported set. Flags: `--flag`, `--flag=value`, or `--flag value`.

`tinker ui` occupies the plugin inspect WebSocket; agent-browser on the same plugin will disconnect it (and vice versa). Confirm the plugin id with `tinker list --short` / `tinker list <plugin>` first.

## Troubleshooting

**`Plugin is not running`** — `tinker open <plugin>` first.

**`Ref not found` / locator timeout** — Snapshot again; use a fresh ref.

**`File access denied` / outside allowed roots** — Write under the plugin UI data dir, or omit `--filename`.

**CDP / connect errors** — Close and reopen the plugin, retry `tinker ui`. Don't attach agent-browser to the same plugin while `ui` is in use.
