# Shared Components and Utilities

Tinker plugins should reuse shared UI, store, and AI logic instead of rebuilding.

## Quick Rules

- Import `share/base.scss` in plugin `index.scss`.
- Use `tw` utilities from `share/theme.ts`; do not hardcode colors.
- Plugin stores extend `BaseStore`, call `super()` first, then `makeAutoObservable(this)`.
- `share/components/AiChat` provides chat UI and `PluginChat` for editor plugins.
- `share/lib/Agent` owns AI message state, tool-call loops, and streaming.

## Base Styles

```scss
// src/index.scss (use src/renderer/index.scss for preload plugins)
@use '../../share/base.scss';
@config "../tailwind.config.js";
```

Third-party style overrides live in `share/styles/`. For OverlayScrollbars, import `share/styles/overlayscrollbars.scss` and use `share/components/OverlayScrollbars`.

## Theme

```ts
import { tw } from 'share/theme'

<div className={tw.bg.secondary} />
<span className={tw.text.primary} />
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
```

Common tokens: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.text.*`, `tw.hover`, `tw.active`.

## BaseStore

```ts
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/store/Base'

class Store extends BaseStore {
  input = ''
  constructor() {
    super()
    makeAutoObservable(this)
  }
}
export default new Store()
```

## Components

### Toolbar, Dialogs & Form

```ts
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
} from 'share/components/Toolbar'
import { alert, AlertProvider } from 'share/components/Alert'
import { confirm, ConfirmProvider } from 'share/components/Confirm'
import { prompt, PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import Slider from 'share/components/Slider'
import ScanDirsModal from 'share/components/ScanDirsModal'
```

Wrap `App.tsx` with dialog/toast providers. Use `toast` directly for toasts.

### Component Index

Simple components — import and use directly:

| Component | Import |
|-----------|--------|
| CopyButton | `share/components/CopyButton` |
| Tooltip | `share/components/Tooltip` |
| NavList | `share/components/NavList` |
| Tree | `share/components/Tree` |
| Grid | `share/components/Grid` |
| TabBar | `share/components/TabBar` |
| StatusBar | `share/components/StatusBar` |
| DarkModeSwitch | `share/components/DarkModeSwitch` |
| FileOpen / FolderOpen / ImageOpen | `share/components/FileOpen` etc. |
| FileIcon | `share/components/FileIcon` |
| Welcome | `share/components/Welcome` |
| Webview | `share/components/Webview` |

Vendor scripts required for some viewers:

| Component | Vendor scripts |
|-----------|----------------|
| HexEditor | `react-hex-editor` |
| VideoPlayer | `videojs` (+ `share/styles/videoPlayer.scss`) |
| MarkdownPreview | `markdown`, `syntaxhighlighter`, `mermaid` |
| PdfViewer | `pdfjs` |
| FilePreview | depends on file type (see component) |

### OverlayScrollbars

Import `share/styles/overlayscrollbars.scss` in plugin `index.scss`, then:

```ts
import OverlayScrollbars, {
  type OverlayScrollbarsRef,
} from 'share/components/OverlayScrollbars'
```

### AiChat

Translations register automatically in the `aiChat` i18n namespace. Do not use that namespace directly — use the components below.

**Low-level** (render-only): `MessageList`, `ChatInputArea`, `ChatClearButton`, `MarkdownContent`, `SearchCard`, `ToolCard`. Provide messages and handlers yourself. Use `getSearchCardProps(toolMsg)` for `SearchCard`.

**PluginChat** (full assistant panel for editor plugins): pair with `share/lib/aiChat` and `AiChatStore`:

```ts
import { PluginChat } from 'share/components/AiChat'
import AiChatStore from 'share/store/AiChat'
import { LocalStoreChatPrefs } from 'share/lib/aiChat/chatPrefsStorage'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import { IndexedDbChatStorage } from 'share/lib/aiChat/chatStorage'
import { getPluginChatProps } from 'share/lib/aiChat/uiProps'
import { initAiChatAvailability } from 'share/lib/aiChat/aiAvailability'

const sessionStorage = new IndexedDbChatStorage('my-plugin')
const chat = new AiChatStore({
  chatSession: new ChatSession({ sessionId: sessionStorage.sessionId, tools: MY_AGENT_TOOLS }),
  sessionStorage,
  initialSystemPrompt: 'You are a ... assistant.',
})

void initAiChatAvailability(storage).then(({ hasAI, chatOpen }) => {
  store.hasAI = hasAI
  store.chatOpen = chatOpen
})

// In observer parent:
<PluginChat {...getPluginChatProps(store.chat)} isDark={store.isDark} title={t('chatTitle')} />
```

Plugin-specific: `systemPrompt`, tool execute handlers, optional `getToolArgSummary` (full string; `ToolCard` truncates), optional `renderToolMessage`. Use `createToolMessageHelpers` only for a custom tool whitelist. Vendor: `idb`, `resizablepanels`, `overlayscrollbars`, `markdown`, `syntaxhighlighter`. Reference: `tinker-regexp`, `tinker-json-editor`.

### MCP Tools

Define tool schemas in `package.json` under `tinker.mcp.tools`, then wire handlers:

```ts
import pkg from '../../package.json'
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    my_tool: myTool,
    get_state: (store) => getState(store),
  })
}

// On store: readonly mcp = createMcpApi(() => this)
```

`createPluginMcpApi` reads schemas, dispatches handlers, registers via `tinker.registerMcp` (host serializes results), and builds agent tools. See `share/lib/mcp.ts` for `PluginMcp`, `formatMcpToolResult`, etc.

For AiChat tool-arg previews, optional `getToolArgSummary` should return the full preview string — `ToolCard` truncates in the UI. Only provide a custom summary when args need special formatting (e.g. regexp `pattern` + `flags`).

### TextSearch

```ts
import TextSearchSidebar, { getTextSearchUIProps } from 'share/components/TextSearch'
import TextSearch from 'share/lib/textSearch'

const search = new TextSearch({ storageNamespace: 'my-plugin-search' })

<TextSearchSidebar
  {...getTextSearchUIProps(search)}
  onSelectMatch={(m) => openInEditor(m.path, m.lineNumber, m.submatches)}
/>
```

Add `@use '../../share/styles/textSearch.scss'` for highlight classes.

### WorkingTree

```ts
import WorkingTreeSidebar, { getWorkingTreeUIProps } from 'share/components/WorkingTree'

<WorkingTreeSidebar {...getWorkingTreeUIProps(store)} />
```

Implement `WorkingTreeController` on your store. Helpers in `share/lib/workingTree`.

### Terminal

```ts
import Terminal, { getTerminalSession } from 'share/components/Terminal'

<Terminal createSession={(cols, rows) => tinker.createTerminal({ cols, rows })} />
```

**TerminalPanel** — multi-tab, split-pane. Render-only; use `getTerminalPanelProps(terminal, isDark)` in an `observer` parent:

```ts
import TerminalStore from 'share/store/Terminal'
import { TerminalPanel, getTerminalPanelProps } from 'share/components/TerminalPanel'

this.terminal = new TerminalStore('my-plugin', () => this.rootPath)
this.terminal.initIfOpen()

{store.terminalOpen && (
  <TerminalPanel {...getTerminalPanelProps(store.terminal, store.isDark)} />
)}
```

### FileTree

```ts
import FileTree, { type IFileTreeDataSource } from 'share/components/FileTree'

const dataSource: IFileTreeDataSource = {
  readDir: async (path) => codeEditor.readDir(path),
  createNode: async (parentPath, name, type) => { /* ... */ },
  renameNode: async (oldPath, newPath) => { /* ... */ },
  deleteNode: async (path) => { /* ... */ },
}

<FileTree
  nodes={tree}
  rootPath={rootPath}
  dataSource={dataSource}
  onOpenFile={(path, name) => openFile(path, name)}
/>
```

Pass `rootPath` for blank-area context menu (New File / New Folder). File watching is the consumer's responsibility — use `onExpandChange`, `refreshDirs`, and `refreshVersion`.

### File & Media

**FileList** — list/grid browser with multi-select, sorting, context menus. Pass `renderIcon` for custom icons.

**PathBar** — collapsible breadcrumb; pass `items` and optional `formatSegment`. Export `PathBarItem` for segment lists.

**FilePreview** — side panel preview; images use `ImageViewer`. **PhotoViewer** — full-screen gallery; items need `id`, `title`, `width`, `height` plus `getThumbnailUrl` / `getPreviewUrl`.

**PdfViewer** — controlled PDF renderer; also exports `Thumbnail` and `Outline` atoms for custom sidebars.

**MarkdownPreview** — GFM + syntax highlighting + Mermaid diagrams (fenced `mermaid` code blocks); optional `scrollPercent` / `onScrollPercentChange` to sync with an editor.

```ts
import FileList from 'share/components/FileList'
import PathBar from 'share/components/PathBar'
import FilePreview from 'share/components/FilePreview'
import PhotoViewer from 'share/components/PhotoViewer'
import PdfViewer from 'share/components/PdfViewer'
import MarkdownPreview from 'share/components/MarkdownPreview'
```

## Hooks

```ts
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { useInView } from 'share/hooks/useInView'
import { useBlameDecorations } from 'share/hooks/useBlameDecorations'
```

## Agent

Manages messages, AI streaming, tool-call loops, and abort state.

```ts
import { Agent, type AgentTool } from 'share/lib/Agent'

const agent = new Agent({ provider: 'openai', model: 'gpt-4o', systemPrompt: '...', tools })
await agent.send('Hello')
agent.abort()
```

## Shared Tools

```ts
import { WEB_FETCH_TOOL, WEB_SEARCH_TOOL } from 'share/tools/web'
import { EXEC_TOOL } from 'share/tools/shell'
import { READ_FILE_TOOL, WRITE_FILE_TOOL, EDIT_FILE_TOOL, LIST_DIR_TOOL } from 'share/tools/fileSystem'
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
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'
import { openPopupWindow } from 'share/lib/popupWindow'
import {
  getHolidaysForYearRange,
  getHolidayTemplates,
  HOLIDAYS_NS,
} from 'share/lib/holidays' // requires calendar.js vendor
```

**Popup window** options: `width`, `height`, `minWidth?`, `minHeight?`, `alwaysOnTop?`, `resizable?`, `webviewTag?`.

**Holidays** — built-in international and Chinese holidays; translations auto-register in `holidays` namespace.

## Git Preload (`share/preload/git.ts`)

Exposed via preload `contextBridge` as `git`:

- `searchCommits(ref, query, skip?, limit?, author?)`
- `getAuthors(ref)` / `getCheckoutInfo()` / `getWorkingTreeStatus()`
- `getWorkingTreeFileDiffContent(path, group, status, renameFrom?)`
- `stageFile(path)` / `unstageFile(path)` / `discardFile(path, group)`
- `stageFiles(paths)` / `unstageAllFiles()` / `discardFiles(paths, group)`
- `commitStaged(message)`
