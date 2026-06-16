# Shared Components and Utilities

Tinker plugins should reuse shared UI, store, and AI logic instead of rebuilding.

## Quick Rules

- Import `share/base.scss` in plugin `index.scss`.
- Use `tw` utilities from `share/theme.ts`; do not hardcode colors.
- Plugin stores extend `BaseStore`, call `super()` first, then `makeAutoObservable(this)`.
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
import { tw } from 'share/theme'

<div className={tw.bg.secondary} />
<span className={tw.text.primary} />
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
```

Common tokens: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.text.*`, `tw.hover`, `tw.active`.

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

## Components

### Toolbar

```ts
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
} from 'share/components/Toolbar'
```

### Dialogs & Toaster

```ts
import { alert, AlertProvider } from 'share/components/Alert'
import { confirm, ConfirmProvider } from 'share/components/Confirm'
import { prompt, PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'
```

Wrap `App.tsx` with providers. Use `toast` directly for toasts.

### Form

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

Render-only. Provide `messages`, `send`, `retry`, `delete`, and session logic. Use `getSearchCardProps(toolMsg)` for `SearchCard`.

### TextSearch

```ts
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
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
import WorkingTreeSidebar, {
  getWorkingTreeUIProps,
} from 'share/components/WorkingTree'

<WorkingTreeSidebar {...getWorkingTreeUIProps(store)} />
```

Implement `WorkingTreeController` on your store. Helpers in `share/lib/workingTree`.

### Welcome

```ts
import Welcome, { type WelcomeAction } from 'share/components/Welcome'

const actions: WelcomeAction[] = [
  { icon: <Plus size={20} />, label: t('newFile'), onClick: handleNew },
  { icon: <FolderOpen size={20} />, label: t('openFile'), onClick: handleOpen },
]

<Welcome
  title={t('welcomeTitle')}
  description={t('welcomeDescription')}
  actions={actions}
  recentFiles={store.recentFiles}
  onOpenRecent={(path) => store.openFile(path)}
  onRemoveRecent={(path) => store.removeRecentFile(path)}
/>
```

### FileIcon

```ts
import FileIcon from 'share/components/FileIcon'

<FileIcon name="app.tsx" isDark={store.isDark} size={18} />
```

### Terminal

```ts
import Terminal, { getTerminalSession } from 'share/components/Terminal'
```

```ts
<Terminal createSession={(cols, rows) => tinker.createTerminal({ cols, rows })} />
```

### TerminalPanel

Multi-tab, split-pane terminal panel:

```ts
import Terminal from 'share/store/Terminal'
import { TerminalPanel } from 'share/components/TerminalPanel'

// In store:
this.terminal = new Terminal('my-plugin', () => this.rootPath)
this.terminal.initIfOpen()

// In layout:
{store.terminalOpen && (
  <TerminalPanel terminal={store.terminal} isDark={store.isDark} />
)}
```

### FileTree

```ts
import FileTree, {
  type ITreeNode,
  type IFileTreeDataSource,
} from 'share/components/FileTree'

const dataSource: IFileTreeDataSource = {
  readDir: async (path) => codeEditor.readDir(path),
  createNode: async (parentPath, name, type) => { /* create */ },
  renameNode: async (oldPath, newPath) => { /* rename */ },
  deleteNode: async (path) => { /* delete */ },
}

<FileTree
  nodes={tree}
  rootPath={rootPath}
  dataSource={dataSource}
  onOpenFile={(path, name) => openFile(path, name)}
  getRootContextMenu={() => [/* optional blank-area menu items */]}
/>
```

Pass `rootPath` to enable a blank-area context menu with built-in New File / New Folder actions at the project root.
```

File watching is the consumer's responsibility — use `onExpandChange`, `refreshDirs`, and `refreshVersion`.

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
import Grid from 'share/components/Grid'
import HexEditor from 'share/components/HexEditor'    // requires react-hex-editor vendor
import VideoPlayer from 'share/components/VideoPlayer'  // requires videojs vendor
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
})

await agent.send('Hello')
agent.abort()
agent.isGenerating
agent.setProvider / setModel / setSystemPrompt / setMessages
```

## Shared Tools

```ts
import { WEB_FETCH_TOOL, WEB_SEARCH_TOOL } from 'share/tools/web'
import { EXEC_TOOL } from 'share/tools/shell'
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

### Popup Window

```ts
import { openPopupWindow } from 'share/lib/popupWindow'

openPopupWindow(
  { width: 400, height: 350, alwaysOnTop: true },
  (popup, onClose) => <MyComponent onClose={onClose} />
)
```

Options: `width`, `height`, `minWidth?`, `minHeight?`, `alwaysOnTop?`, `resizable?`, `webviewTag?`.

## Git Preload (`share/preload/git.ts`)

Exposed via preload `contextBridge` as `git`:
- `searchCommits(ref, query, skip?, limit?, author?)`
- `getAuthors(ref)` / `getCheckoutInfo()` / `getWorkingTreeStatus()`
- `getWorkingTreeFileDiffContent(path, group, status, renameFrom?)`
- `stageFile(path)` / `unstageFile(path)` / `discardFile(path, group)`
- `stageFiles(paths)` / `unstageAllFiles()` / `discardFiles(paths, group)`
- `commitStaged(message)`
