# AGENTS.md

Guidelines that AI coding assistants must follow when developing code for the Tinker plugin system.

## Core Constraints

### No npm Dependency Installation

**AI is absolutely prohibited from installing any npm packages on its own!**

- **Forbidden**: `npm install`, `npm add`, `pnpm add`, `yarn add` commands or modifying `package.json` dependencies
- **Must Ask**: If a feature requires a new dependency, ask the developer first

**Solution Priority**:
1. **Licia Library** - Check [licia.liriliri.io](https://licia.liriliri.io/) first (already included)
2. **Existing Dependencies** - Check `package.json`
3. **Shared Code** - Check `share/` directory
4. **Native APIs** - Use JavaScript/TypeScript/Web Standard APIs
5. **Ask Developer** - Only if none of the above works

## Tech Stack

* React 18
* MobX (mobx + mobx-react-lite)
* TypeScript
* Tailwind CSS
* Vite
* Electron
* i18next (Internationalization)
* **Licia** (Utility library - preferred)

## Shared Resources

See `share/README.md` for Store patterns, component conventions, and full API documentation.

**Important**: When updating `share/`, synchronously update `share/README.md`

## Tailwind CSS & Theme

Always use theme utilities from `share/theme.ts`. Never hardcode colors. Only use SCSS for third-party library style overrides.

## Persistent Storage

Use `licia/LocalStore` for data persistence. Reference: `tinker-json-editor/src/store.ts:14,64-70,73-74`

## Preload Scripts (Advanced Plugins)

Use when Node.js API access is needed. Expose secure APIs via `contextBridge.exposeInMainWorld()`.

**Important**: The global `tinker` object is accessible in preload scripts.

Reference: `tinker-hosts/src/preload/index.ts:16-129`

## Tinker API

Global `tinker` object provides system features:
- `getTheme()` / `getLanguage()` - Get settings
- `showOpenDialog()` / `showSaveDialog()` - File dialogs
- `showItemInPath()` - Show file in file manager
- `showContextMenu()` - Context menu
- `on()` - Event listener (theme/language changes)

Available in renderer process and preload scripts. See `tinker.d.ts` for details.

**Note**: BaseStore automatically handles theme management.

## Coding Standards

**MANDATORY**: After every code change to a plugin, you MUST immediately run `/lint <changed-file-path>` on the modified files before considering the task complete. This is not optional — do not skip this step, do not wait to be asked. If lint reports errors, fix them and re-run lint until it passes.

## New Plugin

Use `/new-plugin` skill to create a new plugin.
