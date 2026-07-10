---
name: create
description: Create and run a standalone Tinker plugin from the tinker-whois template. Use when the user asks to create a new Tinker plugin, scaffold a plugin project, npm link for local development, or get a plugin running in Tinker.
allowed-tools: Bash(git:*), Bash(npm:*), Bash(tinker:*)
---

# Create a Tinker plugin

```bash
git clone --depth 1 https://github.com/liriliri/tinker-whois tinker-<name>
cd tinker-<name>
```

Read **`AGENTS.md`** in the cloned repo, then implement the plugin.

```bash
npm install && npm run build && npm link
tinker quit && tinker open <name>
```

Dev loop: `npm run dev` + `tinker restart <name>`.
