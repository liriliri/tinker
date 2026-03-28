# Shared Components and Utilities

Shared components, utility classes, and hooks for the Tinker plugin system.

## Base Styles

Import `share/base.scss` in `index.scss`:

```scss
// Basic: src/index.scss
@use '../../share/base.scss';
@config "../tailwind.config.js";

// Advanced: src/renderer/index.scss
@use '../../../share/base.scss';
@config "../../tailwind.config.js";
```

## Theme

Use unified theme from `share/theme.ts`. Never hardcode colors.

```typescript
import { tw, THEME_COLORS } from 'share/theme'

<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
<Copy className={copied ? tw.primary.text : ''} />
<span className={`${tw.text.primary} ${tw.primary.textHover}`}>Hover me</span>
<div className={tw.bg.secondary}>Content</div>
<input className={`${tw.bg.input} border ${tw.border}`} />
<div className={`${tw.hover} ${isActive ? tw.active : ''}`} />
```

Patterns: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.divide`, `tw.text.{primary|secondary|tertiary}`, `tw.hover`, `tw.active`.

## BaseStore

All plugin stores must extend `BaseStore`. Call `super()` first, then `makeAutoObservable(this)`. Access theme via `store.isDark`.

```typescript
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  input: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get isEmpty() { return this.input.length === 0 }
  setInput(value: string) { this.input = value }
}

export default new Store()
```

## Shared Components

### Toolbar

```typescript
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer, ToolbarSearch, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'

<Toolbar>
  <ToolbarButton onClick={handleCopy}><Copy size={TOOLBAR_ICON_SIZE} /></ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton variant="toggle" active={store.isActive} onClick={() => store.toggle()}>Toggle</ToolbarButton>
  <ToolbarSearch value={store.searchQuery} onChange={(v) => store.setSearchQuery(v)} placeholder="Search..." />
  <ToolbarSpacer />
  <ToolbarButton menu={[{ label: 'Action', click: handleAction }]}>Menu</ToolbarButton>
</Toolbar>
```

`ToolbarButton` props: `variant` ('action' | 'toggle'), `active`, `menu`, `longPressDuration`

### Dialog Components

```typescript
import { alert, AlertProvider } from 'share/components/Alert'
import { confirm, ConfirmProvider } from 'share/components/Confirm'
import { prompt, PromptProvider } from 'share/components/Prompt'

await alert({ title: 'Error', message: 'Failed!' })
const ok = await confirm({ title: 'Delete', message: 'Sure?' })
const value = await prompt({ title: 'Name', defaultValue: 'Untitled' })
```

Setup in `App.tsx`: wrap with `<AlertProvider>`, `<ConfirmProvider>`, `<PromptProvider>` passing `locale={i18n.language}`.

### Toaster

```typescript
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'

// Wrap app with <ToasterProvider>
toast.success('Saved')
toast.error('Failed')
```

### Form Components

```typescript
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import Slider from 'share/components/Slider'

<Select value={store.value} onChange={store.setValue} options={options} />
<Checkbox checked={store.enabled} onChange={store.setEnabled} label="Enable" />
<Slider min={0} max={100} value={store.size} onChange={store.setSize} disabled={!store.enabled} />
```

### AiChat

Display-only AI chat UI components. Data and callbacks are handled by the caller.

```typescript
import { MessageList, ChatInput, MarkdownContent, type ChatMessage } from 'share/components/AiChat'

<MessageList
  messages={store.messages}
  sessionId={store.sessionId}      // used to detect session switches (instant scroll)
  isDark={store.isDark}
  emptyHint={t('emptyHint')}
  retryLabel={t('retry')}
  deleteLabel={t('delete')}
  errorPrefix={t('errorPrefix')}
  searchResultsLabel={t('searchResults')}
  searchingLabel={t('searching')}
  searchFailedLabel={t('searchFailed')}
  onRetryLast={() => store.retryLastMessage()}
  onDelete={(id) => store.deleteMessage(id)}
  onOpenUrl={(url) => openExternal(url)}
/>

<ChatInput
  value={store.input}
  onChange={(v) => store.setInput(v)}
  onSend={() => store.sendMessage()}
  onStop={() => store.abortGeneration()}
  isGenerating={store.isGenerating}
  canSend={store.canSend}
  placeholder={t('inputPlaceholder')}
  sendLabel={`${t('send')} (Enter)`}
  stopLabel={t('stop')}
  extra={<MyModelSelector />}      // optional slot on the left of the send button
/>

<MarkdownContent isDark={store.isDark}>{markdownString}</MarkdownContent>
```

**ChatMessage type**:
```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  generating?: boolean
  error?: string
  // tool role fields (web search)
  toolStatus?: 'running' | 'done' | 'error'
  toolArgs?: Record<string, unknown>
  data?: unknown
}
```

### Grid

Data grid wrapping AG Grid with Tinker theme integration.

```typescript
import Grid from 'share/components/Grid'
import { ColDef } from 'ag-grid-community'

const columnDefs: ColDef<RowData>[] = [
  { field: 'name', headerName: 'Name', flex: 1, sortable: true },
]

<Grid<RowData> isDark={store.isDark} ref={gridRef} columnDefs={columnDefs} rowData={rowData} rowHeight={40} />
```

Props: all `AgGridReactProps` plus `isDark: boolean`. Supports `ref` forwarding to access the AG Grid API.

### Other Components

```typescript
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import ImageOpen from 'share/components/ImageOpen'
import Tooltip from 'share/components/Tooltip'
import NavList, { NavListItem } from 'share/components/NavList'
import Tree, { TreeNodeData } from 'share/components/Tree'

<CopyButton text="copy me" title="Copy" />
<CopyButton variant="toolbar" text={store.text} disabled={store.isEmpty} />
<CopyButton variant="icon" text={data} size={20} />

<FileOpen onOpenFile={(file) => store.handleFile(file)} openTitle={t('openFile')} supportedFormats="PNG, JPG" fileName={store.fileName} />

<ImageOpen onOpenImage={() => store.openImage()} openTitle="Drop image or click" supportedFormats="PNG, JPG, WebP" />

<Tooltip visible={show} x={x} y={y} content="Hint" />

// NavList - vertical navigation with icon, label, count and active state
const items: NavListItem[] = [{ id: 'all', icon: List, label: t('all'), count: store.total }]
<NavList items={items} activeId={store.currentId} onSelect={(id) => store.setCurrentId(id)} />

// Tree - generic tree view with expand/collapse and highlighting
<Tree<MyNode> data={treeData} onNodeClick={(node) => handleClick(node)} activeNodeId={activeId} emptyText="No data" />
```

## Shared Hooks

### useCopyToClipboard

Auto-resets `copied` after 2 seconds.

```typescript
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'

const { copied, copyToClipboard } = useCopyToClipboard()
```

## Agent

AI Agent class that handles streaming, tool-call loops, and message management. Decoupled from MobX via callbacks.

```typescript
import { Agent } from 'share/lib/Agent'
import type { AgentMessage, AgentTool, ToolCall, ToolStatus, SearchResult } from 'share/lib/Agent'
import { WEB_SEARCH_TOOL, createWebSearchToolResult } from 'share/tools/web'

const agent = new Agent({
  provider: 'openai',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant.',
  maxIterations: 10,           // default 20
  tools: [
    {
      definition: WEB_SEARCH_TOOL,     // function schema passed to the AI
      execute: async (args) => {
        // return a string, or { content: string, data?: unknown }
        const results = await webSearch(args.query as string)
        return createWebSearchToolResult(results)
      },
    },
  ],
  onMessage: (msg) => runInAction(() => messages.push(msg)),
  onMessageUpdate: (id, patch) =>
    runInAction(() => {
      const msg = messages.find((m) => m.id === id)
      if (msg) Object.assign(msg, patch)
    }),
  getMessages: () => messages,
})

// Update config at any time
agent.setProvider('anthropic')
agent.setModel('claude-opus-4-5')
agent.setSystemPrompt('New system prompt')
agent.setTools([...])

// Send a message (auto-adds user/assistant messages and runs the tool loop)
await agent.send('Hello!')

// Abort generation
agent.abort()

// Read-only state
agent.isGenerating  // boolean
```

**AgentMessage type** (used as `ChatMessage` in both AI plugins):
```typescript
interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  generating?: boolean
  error?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolStatus?: 'running' | 'done' | 'error'
  data?: unknown
}
```

## Shared Tools

Reusable AI tool definitions for use with `Agent`.

### `share/tools/web`

```typescript
import {
  WEB_SEARCH_TOOL,
  createWebSearchToolResult,
} from 'share/tools/web'
import { webSearch } from 'share/tools/webImpl'
```

| Export | Type | Description |
|---|---|---|
| `WEB_SEARCH_TOOL` | Tool definition | `web_search` function schema for renderer/agent |
| `createWebSearchToolResult(results)` | Helper | Build `{ content, data }` for `web_search` tool execution |
| `webSearch(query)` | Implementation | Node-side web search implementation for preload (language from `tinker.getLanguage()`) |

### `share/tools/fileSystem`

```typescript
import {
  EXEC_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  getToolLabel,
} from 'share/tools/fileSystem'
import type { ToolName } from 'share/tools/fileSystem'
```

| Export | Tool name | Description |
|---|---|---|
| `EXEC_TOOL` | `exec` | Run a shell command |
| `READ_FILE_TOOL` | `read_file` | Read a file with line numbers |
| `WRITE_FILE_TOOL` | `write_file` | Write content to a file |
| `EDIT_FILE_TOOL` | `edit_file` | Replace text within a file |
| `LIST_DIR_TOOL` | `list_dir` | List directory contents |

`getToolLabel(name)` returns a human-readable label for a tool name (e.g. `'exec'` → `'Shell'`).

## Shared Utilities

```typescript
import { openImageFile, fileExists, resolveSavePath } from 'share/lib/util'

// Opens native file dialog; returns { file: File, filePath: string } | null
const result = await openImageFile({ title: 'Open Image' })

// Returns boolean
const exists = await fileExists('/path/to/file')

// Returns unique save path; appends -yyyymmddHH (or -yyyymmddHHMM) if path exists
const savePath = await resolveSavePath('/path/to/recording.mp3')
```
