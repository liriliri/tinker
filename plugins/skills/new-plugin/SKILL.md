---
description: Create a new Tinker plugin from the template
argument-hint: <plugin-name> [description]
allowed-tools: Bash, Read, Write, Edit, Glob
---

# New Plugin

Create a new Tinker plugin from scratch.

## Arguments

- `plugin-name`: kebab-case name without the `tinker-` prefix (e.g., `base64`, `color-picker`)
- `description`: optional short description in English

## Steps

### 1. Find similar existing plugins

List existing plugins and check if any are functionally similar to the new one:

```bash
ls -d tinker-*/
```

If a similar plugin exists, ask the user whether to copy it as the base instead of `tinker-template`. Use the user's choice as the copy source in the next step.

### 2. Determine plugin type

Ask the user: does this plugin need Node.js/Electron APIs (file system, OS info, native dialogs beyond `tinker.*`, etc.)? If yes → **advanced** (with `src/preload/` and `src/renderer/`). If no → **basic** (flat `src/` layout).

### 3. Copy source

```bash
cp -r tinker-<source> tinker-<plugin-name>
```

Where `<source>` is either the similar plugin chosen by the user or `tinker-template`.

### 4. Update `package.json`

Edit `tinker-<plugin-name>/package.json`:

- `name` → `"tinker-<plugin-name>"`
- `description` → provided description
- `tinker.name` → Title Case English name
- `tinker.locales.zh-CN.name` → Chinese name (ask if unclear)

**Basic plugin** — simplify scripts and paths:
- Replace `dev` / `build` with single `vite` commands (no `concurrently`)
- Change `tinker.main` to `"dist/index.html"`
- Remove `tinker.preload`

If the source is `tinker-template`, also restructure the directory:
```bash
mv src/renderer/* src/
rm -rf src/renderer src/preload
```

Then update import paths in `index.html` and all files under `src/` — replace any `src/renderer/` references with `src/`, and fix relative import paths affected by the directory change (e.g. `../../../share/` → `../../share/`).

**Advanced plugin** — keep template scripts as-is, only update name/description.

Also remind the user: **`icon.png` must be replaced** with a real icon (200×200 px).

### 5. Build test

```bash
cd tinker-<plugin-name> && npm run build
```

Fix any TypeScript or build errors before finishing.

### 6. Stop — do not implement features

The scaffold is complete. **Do not** modify `App.tsx`, `store.ts`, i18n files, or any other source files to implement the plugin's actual functionality. Leave all template content as-is and inform the user that the scaffold is ready for them to implement.
