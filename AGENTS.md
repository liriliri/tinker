# TINKER

An Electron-based desktop toolbox application with an extensible plugin system.

## Tech Stack

- **Runtime**: Electron 30, Node.js
- **Frontend**: React 19, MobX 6, Sass
- **Build**: Vite 5, TypeScript
- **UI Components**: luna-\* component library (modal, menu, data-grid, toolbar, etc.)
- **Utilities**: licia (utility library), pinyin (Chinese input support)
- **Packaging**: electron-builder
- **i18n**: Custom I18n (licia/I18n), locale files in JSON

## Architecture

```
src/
├── common/        # Shared types, theme, i18n locale files, utilities
├── main/          # Electron main process
│   ├── lib/       # Core logic (store, plugin management, tray, shortcuts)
│   └── window/    # Window creation and IPC handlers
├── renderer/      # React UI (each page is a sub-directory)
│   └── main/      # Main window UI
│       ├── components/  # React components (TitleBar, PluginList)
│       ├── lib/         # Renderer-specific utilities
│       └── store.ts     # MobX store
├── preload/       # Preload scripts bridging renderer to main via IPC
└── share/         # Code shared across multiple Electron apps
    ├── common/    # Shared logging, i18n, types
    ├── main/      # Shared main process logic (window, ipc, theme, language)
    ├── preload/   # Shared preload IPC wrappers
    └── renderer/  # Shared renderer code (components, stores, lib)
```

## Layer Responsibilities

- **common/**: Type definitions, theme constants, i18n locale JSONs. No process-specific code.
- **main/**: Main process only. Manages windows, plugins, tray, global shortcuts, persistent stores (FileStore).
- **renderer/**: React components and MobX stores. Communicates with main process exclusively through preload APIs.
- **preload/**: Exposes `main` and `preload` globals to renderer via contextBridge. Uses `ipcRenderer.invoke` wrapped in typed helpers.
- **share/**: Reusable code across different Electron apps (e.g., terminal, process manager, about window share the same base infrastructure).

## IPC Pattern

Renderer calls `main.someMethod()` → preload `invoke('someMethod')` → main process `handleEvent('someMethod', handler)`.

Events from main to renderer: `window.sendTo(name, channel, ...args)` → preload `main.on(event, callback)`.

## Plugin System

Plugins live in `plugins/`. Built-in plugins are bundled in `dist/plugins/`. External plugins are discovered from npm global packages prefixed with `tinker-`.

Each plugin defines a `tinker` field in its `package.json` (IRawPlugin) specifying entry point, icon, preload script, and locale overrides.
