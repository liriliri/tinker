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
// src/index.scss
@use '../../share/base.scss';
@config "../tailwind.config.js";

// src/renderer/index.scss
@use '../../../share/base.scss';
@config "../../tailwind.config.js";
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

Use `MessageList` and `ChatInput` for rendering only; provide your own `messages`, `send`, `retry`, `delete`, and session switching logic.
Use `SearchCard` for `web_search` tool results and pass plain UI data like `query`, `results`, `isRunning`, and `error` from the plugin host.
Use `getSearchCardProps(toolMsg)` to extract `SearchCardProps` from an `AgentMessage` — it handles safe data extraction and `isRunning` detection.

### Other Common Components

```ts
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import ImageOpen from 'share/components/ImageOpen'
import Tooltip from 'share/components/Tooltip'
import NavList from 'share/components/NavList'
import Tree from 'share/components/Tree'
import Grid from 'share/components/Grid'
```

## Hooks

```ts
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
```

## Agent

`share/lib/Agent` manages:

- internal `messages`
- AI streaming
- tool-call loops
- abort state

```ts
import { Agent } from 'share/lib/Agent'
import type { AgentTool } from 'share/lib/Agent'
import { WEB_SEARCH_TOOL, createWebSearchToolResult } from 'share/tools/web'

const tools: AgentTool[] = [
  {
    definition: WEB_SEARCH_TOOL,
    execute: async (args) => {
      const results = await webSearch(args.query as string)
      return createWebSearchToolResult(results)
    },
  },
]

const agent = new Agent({
  provider: 'openai',
  model: 'gpt-4o',
  systemPrompt: 'You are a helpful assistant.',
  maxIterations: 10,
  tools,
  initialMessages: [],
})

agent.setProvider('anthropic')
agent.setModel('claude-opus-4-5')
agent.setSystemPrompt('New prompt')
agent.setMessages(savedMessages)

await agent.send('Hello')
agent.abort()

agent.getMessages()
agent.isGenerating
```

## Shared Tools

### Web

```ts
import {
  WEB_FETCH_TOOL,
  WEB_SEARCH_TOOL,
  createWebFetchToolResult,
  createWebSearchToolResult,
} from 'share/tools/web'
```

### Shell

```ts
import { EXEC_TOOL, getToolLabel } from 'share/tools/shell'
import { exec } from 'share/tools/shellImpl'
```

### File System

```ts
import {
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
} from 'share/tools/fileSystem'
```

## When To Update This File

Update this README when you change shared APIs, conventions, or recommended usage in `share/`.
