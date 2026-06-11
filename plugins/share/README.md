# Shared Components and Utilities

Tinker plugins should reuse the shared layer instead of rebuilding common UI, store, and AI logic.

## Quick Rules

- Import `share/base.scss` in plugin `index.scss`.
- Use `tw` utilities from `share/theme.ts`; do not hardcode colors.
- Plugin stores should extend `BaseStore`, call `super()` first, then `makeAutoObservable(this)`.
- `share/components/AiChat` is display-only. State and actions stay in the caller.
- `share/lib/Agent` owns AI message state, tool-call loops, and streaming.

## Base Styles

```scss
// src/index.scss (use src/renderer/index.scss for preload plugins)
@use '../../share/base.scss';
@config "../tailwind.config.js";
```

## Theme

```ts
import { tw, THEME_COLORS } from 'share/theme'

<div className={tw.bg.secondary} />
<span className={tw.text.primary} />
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
<input className={`${tw.bg.input} border ${tw.border}`} />
```

Common tokens: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.divide`, `tw.text.*`, `tw.hover`, `tw.active`, `tw.diff.*`

## BaseStore

```ts
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  input = ''
  constructor() {
    super()
    makeAutoObservable(this)
  }
}
export default new Store()
```

Use `store.isDark` for theme-aware rendering.

## Shared Components

### Toolbar

```ts
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
```

### Dialogs

```ts
import { alert, AlertProvider } from 'share/components/Alert'
import { confirm, ConfirmProvider } from 'share/components/Confirm'
import { prompt, PromptProvider } from 'share/components/Prompt'
```

Wrap `App.tsx` with the matching providers.

### Toaster

```ts
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'
```

### Form Components

```ts
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import Slider from 'share/components/Slider'
```

### AiChat

```ts
import {
  MessageList,
  ChatInput,
  MarkdownContent,
  SearchCard,
  type ChatMessage,
} from 'share/components/AiChat'
```

`MessageList` and `ChatInput` are render-only; provide your own `messages`, `send`, `retry`, `delete`, and session logic. Use `getSearchCardProps(toolMsg)` to extract props for `SearchCard`.

### HexEditor

```ts
import HexEditor from 'share/components/HexEditor'
;<HexEditor
  data={uint8Array}
  nonce={n}
  isDark={bool}
  onSetValue={(offset, value) => {}}
/>
```

Requires `react-hex-editor` and `styled-components` vendor scripts.

### VideoPlayer

```ts
import VideoPlayer from 'share/components/VideoPlayer'
;<VideoPlayer disabled={false} onTogglePlaylist={fn}>
  <Video src={src} autoPlay />
</VideoPlayer>
```

Wrap inside the player's `Provider` and `Container` from `createPlayer`. Requires `videojs` vendor scripts.

### ImageViewer

```ts
import ImageViewer from 'share/components/ImageViewer'

<ImageViewer
  src={imageSrc}
  fit="contain"
  fitArea={0.8}
  onLoad={(width, height) => {}}
/>
```

Interactive image viewer with wheel zoom, drag pan, double-click reset, and a context menu for rotating the image. Supports `contain` or `cover` fit modes.

### TextSearch

```ts
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
import TextSearch from 'share/lib/textSearch'

const search = new TextSearch({ storageNamespace: 'my-plugin-search' })

// Call getTextSearchUIProps inside an observer — it reads MobX state.
;<TextSearchSidebar
  {...getTextSearchUIProps(search)}
  onSelectMatch={(m) => openInEditor(m.path, m.lineNumber, m.submatches)}
  showFolderPicker={false}
/>
```

`TextSearchSidebar` is a pure UI component (no MobX). `TextSearch` owns query/options/results; `getTextSearchUIProps` maps it to props. Highlight helpers (`buildSegments`, `byteRangeToColumns`, `getLineText`) are exported from the same module for rendering matches in your own editor. Add `@use '../../share/styles/textSearch.scss'` to `index.scss` for highlight classes.

### WorkingTree

```ts
import WorkingTreeSidebar, {
  getWorkingTreeUIProps,
} from 'share/components/WorkingTree'

// Call getWorkingTreeUIProps inside an observer — it reads MobX state.
;<WorkingTreeSidebar {...getWorkingTreeUIProps(store)} />
```

`WorkingTreeSidebar` is a pure UI component (no MobX). Implement `WorkingTreeController` on your store (or pass a compatible object) and map it with `getWorkingTreeUIProps`. Utility helpers (`groupWorkingTreeFiles`, `fileDisplayName`, `isNewWorkingTreeFile`, etc.) are exported from `share/lib/workingTree`.

### Welcome

Welcome screen with action buttons and recent files list. Common pattern for plugins that manage a file-based workspace.

```ts
import Welcome, { type WelcomeAction } from 'share/components/Welcome'

const actions: WelcomeAction[] = [
  {
    icon: <Plus size={20} />,
    label: t('newDatabase'),
    onClick: handleNewDatabase,
  },
  {
    icon: <FolderOpen size={20} />,
    label: t('openDatabase'),
    onClick: handleOpenDatabase,
  },
]

<Welcome
  title={t('welcomeTitle')}
  description={t('welcomeDescription')}
  actions={actions}
  recentFiles={store.recentFiles}
  onOpenRecent={(path) => store.openDatabase(path, password)}
  onRemoveRecent={(path) => store.removeRecentFile(path)}
/>
```

Context menu labels (`open`, `showInFolder`, `removeFromRecent`) are built-in via the component's `welcome` i18n namespace. The plugin only needs `welcomeTitle` and `welcomeDescription` for the header text, plus i18n for action button labels.

### FileIcon

VS Code Seti-style file icon component. Automatically resolves the correct icon from filename/extension and supports dark/light themes. CSS and font are injected globally on first render.

```ts
import FileIcon from 'share/components/FileIcon'

<FileIcon name="app.tsx" isDark={store.isDark} className="ml-0.5 flex-shrink-0" />
<FileIcon name="package.json" isDark={store.isDark} size={18} />
```

**Props:** `name` (filename or path), `isDark` (theme state from store), `size?` (default 16), `className?`

**Icon resolution order:** 1) exact filename match (e.g. `package.json`), 2) extension match (e.g. `tsx`), 3) default file icon.

### Other Components

```ts
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import FolderOpen from 'share/components/FolderOpen'
import ImageOpen from 'share/components/ImageOpen'
import ImageViewer from 'share/components/ImageViewer'
import Tooltip from 'share/components/Tooltip'
import NavList from 'share/components/NavList'
import Tree from 'share/components/Tree'
import Grid from 'share/components/Grid' // AG Grid defaults for header/row height
```

## Hooks

```ts
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
```

## Agent

Manages messages, AI streaming, tool-call loops, and abort state.

```ts
import { Agent, type AgentTool } from 'share/lib/Agent'

const agent = new Agent({
  provider: 'openai',
  model: 'gpt-4o',
  systemPrompt: '...',
  maxIterations: 10,
  tools,
  initialMessages: [],
})

await agent.send('Hello')
agent.abort()
agent.getMessages()
agent.isGenerating
agent.setProvider / setModel / setSystemPrompt / setMessages
```

## Shared Tools

```ts
// Web
import {
  WEB_FETCH_TOOL,
  WEB_SEARCH_TOOL,
  createWebFetchToolResult,
  createWebSearchToolResult,
} from 'share/tools/web'
// Shell
import { EXEC_TOOL, getToolLabel } from 'share/tools/shell'
import { exec } from 'share/tools/shellImpl'
// File System
import {
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
} from 'share/tools/fileSystem'
```

## Utilities

```ts
import {
  isDiskNodeDirectory,
  mediaDurationFormat,
  formatTimeAgo,
  formatRelativeDate,
  openImageFile,
  fileExists,
  resolveSavePath,
  getFileIcon,
  getMimeTypeFromPath,
  getFileCategory,
} from 'share/lib/util'
```

- `formatTimeAgo(dateMs, locale?, style?)` — relative time via `Intl.RelativeTimeFormat` (e.g. "3 days ago"; use `narrow` in compact gutters).
- `formatRelativeDate(dateMs, locale?, titleFormat?)` — `{ label, title }` for timeago display with absolute datetime tooltip.

### Popup Window

```ts
import { openPopupWindow } from 'share/lib/popupWindow'

const popup = openPopupWindow(
  { width: 400, height: 350, minWidth: 300, minHeight: 200, alwaysOnTop: true },
  (popup, onClose) => <MyComponent onClose={onClose} />
)
```

Options: `width`, `height`, `minWidth?`, `minHeight?`, `alwaysOnTop?` (default true), `resizable?` (default true), `webviewTag?`.

### Terminal

```ts
import Terminal, { getTerminalSession } from 'share/components/Terminal'
import { getDefaultShell, getAvailableShells } from 'share/lib/terminal' // preload only
```

Use `<Terminal createSession={(cols, rows) => …} />`. Return `tinker.createTerminal({ cols, rows, cwd?, shell? })` for a local PTY, or any `TerminalSession` (e.g. SSH via preload). `getTerminalSession(paneId)` looks up the active session. Dropping files or folders pastes shell-quoted paths. See `plugins/api-types/tinker.d.ts` for `tinker.Terminal`.

### Terminal Panel

Multi-tab, split-pane terminal panel for embedding in editor-style plugins:

```ts
import Terminal from 'share/store/Terminal'
import { TerminalPanel } from 'share/components/TerminalPanel'

// In plugin store constructor:
this.terminal = new Terminal('my-plugin', () => this.rootPath)
this.terminal.initIfOpen()

// In layout (e.g. bottom panel):
{store.terminalOpen && (
  <TerminalPanel terminal={store.terminal} isDark={store.isDark} />
)}
```

`Terminal` persists open/closed state per plugin (`storageKey`). Expose store methods via thin proxies (`toggleTerminal`, `addTerminalTab`, `splitPane`, etc.) or call `store.terminal` directly. Use `openInDirectory(path, isDirectory)` to open a new tab at a path. Split layout types live in `share/types/terminalLayout.ts`.

### FileTree

```ts
import FileTree, {
  type ITreeNode,
  type IFileTreeDataSource,
} from 'share/components/FileTree'
```

Lazy-loading file tree with pluggable data sources and customizable context menus.

**Quick usage (local filesystem):**

```ts
const dataSource: IFileTreeDataSource = {
  readDir: async (path) => {
    const entries = await codeEditor.readDir(path)
    return entries
  },
  createNode: async (parentPath, name, type) => {
    // create file or directory
  },
  renameNode: async (oldPath, newPath) => {
    // rename
  },
  deleteNode: async (path) => {
    // delete
  },
}

<FileTree
  nodes={tree}
  dataSource={dataSource}
  onOpenFile={(path, name) => openFile(path, name)}
  getContextMenu={(node) => [
    /* custom menu items, appended between built-in create and rename/delete */
  ]}
  onExpandChange={(path, expanded) => trackWatching(path, expanded)}
  onRefreshChildren={(parentPath) => markDirty(parentPath)}
  refreshDirs={dirtyDirs}
  refreshVersion={version}
/>
```

**Key properties:**

- `nodes` — root-level tree nodes
- `iconSize?` — icon size for chevrons, folders, and file placeholders (default 14)
- `dataSource` — adapter providing `readDir` plus optional `createNode`/`renameNode`/`deleteNode`. CRUD methods control which built-in menu items appear.
- `onOpenFile` — called when a file node is clicked
- `getContextMenu` — returns custom menu items, appended between built-in create and rename/delete groups
- `onExpandChange` — consumer tracks which dirs are expanded (for starting/stopping file watching)
- `refreshDirs` + `refreshVersion` — consumer signals which expanded dirs need children re-fetched (e.g. after file system events)
- `onRefreshChildren` — consumer refreshes parent after rename/delete operations (typically calls `markTreeDirDirty` or `loadDirectory`)

**Data source patterns:**

| Source | `readDir`              | `createNode`        | `renameNode`            | `deleteNode`        |
| ------ | ---------------------- | ------------------- | ----------------------- | ------------------- |
| Local  | `codeEditor.readDir()` | `tinker.writeFile`  | `codeEditor.renameItem` | `tinker.rm`         |
| Remote | `fetch(api/list)`      | `fetch(api/create)` | `fetch(api/rename)`     | `fetch(api/delete)` |
| Git    | `git ls-tree`          | —                   | —                       | —                   |

**File watching:** The shared FileTree does not manage file watching — that's the consumer's job. Use `onExpandChange` to start/stop watching, and `refreshDirs` + `refreshVersion` to trigger re-fetches after file system events.

## Git Preload (`share/preload/git.ts`)

Exposed to advanced plugins via preload `contextBridge` as `git`.

- `searchCommits(ref, query, skip?, limit?, author?)` — `query` matches commit message or SHA; `author` filters by author name.
- `getAuthors(ref)` — uses `git shortlog -s -n`; load lazily in UI.
- `getCheckoutInfo()` — current branch or detached HEAD commit.
- `getWorkingTreeStatus()` — staged/changes/untracked groups via `git status -z --ignore-submodules`.
- `getWorkingTreeFileDiffContent(path, group, status, renameFrom?)` — original/modified file content for Monaco diff view.
- `stageFile(path)` / `unstageFile(path)` / `discardFile(path, group)` — stage, unstage, or discard a file.
- `stageFiles(paths)` / `unstageAllFiles()` / `discardFiles(paths, group)` — batch working tree operations.
- `commitStaged(message)` — commit staged changes with the given message.

## When To Update This File

Update this README when you change shared APIs, conventions, or recommended usage in `share/`.
