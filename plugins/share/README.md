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

Common tokens: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.divide`, `tw.text.*`, `tw.hover`, `tw.active`.

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

### Other Components

```ts
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import FolderOpen from 'share/components/FolderOpen'
import ImageOpen from 'share/components/ImageOpen'
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

const popup = openPopupWindow(
  { width: 400, height: 350, minWidth: 300, minHeight: 200, alwaysOnTop: true },
  (popup, onClose) => <MyComponent onClose={onClose} />
)
```

Options: `width`, `height`, `minWidth?`, `minHeight?`, `alwaysOnTop?` (default true), `resizable?` (default true), `webviewTag?`.

### Terminal (Preload)

```ts
import { createTerminalApi } from 'share/lib/terminal'
import type { TerminalApi, ShellInfo, PtySession } from 'share/lib/terminal'

const api = createTerminalApi()
// Expose via contextBridge in your preload script
```

Creates a local PTY manager for use in preload scripts. Methods:

- `create(id, cols, rows, cwd?, shell?)` — spawn a shell
- `write(id, data)` — send input to terminal
- `resize(id, cols, rows)` — resize PTY
- `destroy(id)` — kill terminal
- `onData(id, callback)` — listen for output data
- `onClose(id, callback)` — listen for process exit
- `onInput(id, callback)` — listen for user input (newline)
- `getProcessName(id)` — current process name
- `getCwd(id)` — current working directory basename
- `getFullCwd(id)` — full CWD path
- `getDefaultShell()` — system default shell path
- `getAvailableShells()` — list available shells as `ShellInfo[]`

Accepts an optional `sessions` Map for sharing session state with plugin-specific extensions (e.g. SSH).

## When To Update This File

Update this README when you change shared APIs, conventions, or recommended usage in `share/`.
