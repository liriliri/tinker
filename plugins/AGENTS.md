# AGENTS.md

Guidelines that AI coding assistants must follow when developing code for the Tinker plugin system.

## Core Constraints

### 1. No npm Dependency Installation

**AI is absolutely prohibited from installing any npm packages on its own!**

- **Forbidden**: `npm install`, `npm add`, `pnpm add`, `yarn add` commands or modifying `package.json` dependencies
- **Must Ask**: If a feature requires a new dependency, ask the developer first

**Preferred Solutions**:
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

## Project Structure

### Basic Plugin (No Node.js API)
```
tinker-plugin-name/
├── src/
│   ├── App.tsx              # Main app component (use observer)
│   ├── main.tsx             # Entry file
│   ├── store.ts             # MobX Store (extends BaseStore)
│   ├── index.scss           # Global styles
│   ├── components/          # Components directory
│   ├── i18n/                # Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en-US.json
│   │       └── zh-CN.json
│   └── assets/              # Static assets
├── index.html
├── package.json
└── icon.png                 # Required
```

### Advanced Plugin (With Node.js API)
```
tinker-plugin-name/
├── src/
│   ├── preload/             # Electron Preload scripts
│   │   └── index.ts         # Expose secure Node.js APIs
│   └── renderer/            # Same structure as basic plugin
│       ├── App.tsx
│       ├── main.tsx
│       └── ...
├── index.html
├── package.json
└── icon.png
```

Reference: `tinker-image-cropper`, `tinker-hosts`, `tinker-markdown-editor`

## Naming Conventions

- **Plugin Name**: kebab-case (`tinker-json-editor`, `tinker-code-image`)
- **Component Files**: PascalCase (`TextEditor.tsx`, `Toolbar.tsx`)
- **Store File**: `store.ts` (lowercase)
- **Style File**: `index.scss`
- **Components**: PascalCase (`const Frame = observer(() => {...})`)
- **Functions/Variables**: camelCase (`setJsonInput`, `isDark`)
- **Constants**: UPPER_SNAKE_CASE (`const STORAGE_KEY = 'content'`)
- **Types/Interfaces**: PascalCase (`type EditorMode = 'text' | 'tree'`)

## State Management - MobX

### BaseStore Pattern

All plugin Stores **must extend** `share/BaseStore` for automatic theme management.

```typescript
import BaseStore from 'share/BaseStore'
import { makeAutoObservable } from 'mobx'

class Store extends BaseStore {
  constructor() {
    super() // Initialize theme management
    makeAutoObservable(this)
  }
}

export default new Store()
```

**Key Requirements**:
- Extend `BaseStore`
- Call `super()` in constructor
- Call `makeAutoObservable(this)`
- Export as singleton

**More details**: See `share/README.md` for store method naming conventions and persistence patterns.

## Component Patterns

### Entry File Template

```typescript
// src/main.tsx
import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'

;(async function () {
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
})()
```

### Component Rules

1. **Use observer for components accessing store**: `const Component = observer(() => {...})`
2. **Props must have interface definitions**
3. **Avoid creating new objects/arrays in render**

See `share/README.md` for detailed component patterns.

## Shared Resources (`share/`)

**Available Resources**:
- **BaseStore** - MobX Store base class with theme management
- **theme.ts** - Unified theme configuration (colors, utilities)
- **Components**: Toolbar, Dialog, Alert, Confirm, Prompt, Select, Checkbox, ImageUpload
- **Hooks**: useCopyToClipboard

**Complete Documentation**: See `share/README.md`

**Important**: When updating `share/`, synchronously update `share/README.md`

## Tailwind CSS & Theme

### Use Unified Theme

**Always use theme utilities from `share/theme.ts`**. Never hardcode colors.

```typescript
import { tw, THEME_COLORS } from 'share/theme'

// Correct
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
<div className={tw.border.both}>

// Wrong - don't hardcode colors
<button className="bg-[#0fc25e]">
<div className="border-[#e0e0e0]">
```

### Layout Patterns

```tsx
// Full-screen layout with Toolbar
<div className="h-screen flex flex-col">
  <Toolbar />
  <div className="flex-1 overflow-hidden">
    {/* Main content */}
  </div>
</div>
```

### Style File Structure

```scss
// src/index.scss
@use 'tailwindcss';
@config "../tailwind.config.js";

html.dark {
  color-scheme: dark;
}

/* Only use SCSS for third-party library overrides */
.custom-library {
  background: white;

  :is(.dark *) & {
    background: #1e1e1e;
  }
}
```

**Complete theme API**: See `share/README.md`

## TypeScript

### Type Definitions

```typescript
// Local types (in store.ts or component)
type EditorMode = 'text' | 'tree'
interface DiffStats { additions: number; deletions: number }

// Component Props
interface ComponentProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default observer(function Component({
  value,
  onChange,
  disabled = false
}: ComponentProps) {
  // ...
})
```

**Global types**: See `tinker.d.ts` for Tinker API types

## Internationalization (i18n)

```typescript
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
t('format')  // Translate key
t('lines', { count: 5 })  // With parameters
```

**Files**: `src/i18n/index.ts`, `src/i18n/locales/{en-US,zh-CN}.json`

## Persistent Storage

Use `licia/LocalStore` for data persistence.

Reference: `tinker-json-editor/src/store.ts:14,64-70,73-74`

## Icons and Assets

### Lucide React Icons

```typescript
import { FileText, Copy, Download } from 'lucide-react'

<FileText size={14} />
<Copy size={14} className="text-gray-600 dark:text-gray-300" />
```

### Custom SVG Icons

```typescript
import CustomIcon from '../assets/custom-icon.svg?react'

<CustomIcon width={16} height={16} className="fill-current" />
```

## Preload Scripts (Advanced Plugins)

Use when Node.js API access is needed:

```typescript
// src/preload/index.ts
import { contextBridge } from 'electron'
import * as fs from 'fs'

const pluginAPI = {
  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath)
  },
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    await fs.promises.writeFile(filePath, Buffer.from(data))
  },
}

contextBridge.exposeInMainWorld('pluginAPI', pluginAPI)

declare global {
  const pluginAPI: typeof pluginAPI
}
```

**Important**: The global `tinker` object is also accessible in preload scripts, allowing you to use tinker APIs like `getTheme()`, `showOpenDialog()`, etc.

**Usage in Renderer**:
```typescript
// Direct access (no window. prefix)
const content = await pluginAPI.readFile('/path/to/file')
```

Reference: `tinker-hosts/src/preload/index.ts:16-129`

## Package.json Configuration

```json
{
  "name": "tinker-plugin-name",
  "tinker": {
    "name": "Plugin Name",
    "icon": "icon.png",
    "main": "dist/index.html",
    "preload": "dist/preload/index.js",  // Optional (advanced plugin)
    "locales": {
      "zh-CN": { "name": "插件名称" }
    }
  }
}
```

## Tinker API

Global `tinker` object provides system features.

**Available APIs**:
- `getTheme()` / `getLanguage()` - Get theme and language settings
- `showOpenDialog()` / `showSaveDialog()` - File dialogs
- `showItemInPath()` - Show file in file manager
- `showContextMenu()` - Show context menu
- `on()` - Event listener (theme/language changes)

**Access Scope**:
- Renderer Process: `tinker.*`
- Preload Scripts: `tinker.*`

**Details**: See `tinker.d.ts`

**Note**: BaseStore automatically handles theme management

## Best Practices

1. **Single Responsibility** - Each component handles one functional module
2. **Follow Naming Conventions** - See `share/README.md` for store method naming
3. **Error Handling** - Use try-catch for async operations, `alert()` for errors
4. **Performance** - Use MobX computed properties, avoid new objects in render
5. **Type Safety** - Avoid `any`, use union types, define props interfaces
6. **Theme Consistency** - Always use `tw` utilities from `share/theme`
7. **Prioritize Licia** - Check [licia.liriliri.io](https://licia.liriliri.io/) first

## New Plugin Checklist

- [ ] Copy base structure from `tinker-template`
- [ ] Update `name`, `description`, `tinker.name` in `package.json`
- [ ] Create/replace `icon.png`
- [ ] Create Store extending BaseStore
- [ ] Setup i18n translations (en-US, zh-CN)
- [ ] Implement App component and sub-components
- [ ] Add Tailwind styles using `tw` utilities
- [ ] Test functionality
- [ ] Build test: `npm run build`

## Reference Examples

- **Simplest**: `tinker-timestamp` - Basic structure
- **Medium**: `tinker-json-editor` - Dual editor mode
- **Complex**: `tinker-code-image` - Code screenshots
- **Preload**: `tinker-image-cropper`, `tinker-hosts` - Node.js API usage
