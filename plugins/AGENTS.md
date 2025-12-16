# AGENTS.md

Guidelines that AI coding assistants must follow when developing code for the Tinker plugin system.

## 🚫 Core Constraints

Before starting any development work, you must adhere to the following constraints:

### 1. No npm Dependency Installation ⛔

**AI is absolutely prohibited from installing any npm packages on its own!**

- ❌ **Forbidden**: `npm install`, `npm add`, `pnpm add`, `yarn add` commands
- ❌ **Forbidden**: Modifying `dependencies` or `devDependencies` in `package.json`
- ⚠️ **Must Ask**: If a feature requires a new dependency, you must ask the developer first

**Correct Approach**:
```
AI: "Implementing this feature requires the XXX library. May I add the dependency 'package-name'?"
Developer: [After approval] "Yes"
AI: Then execute npm install package-name
```

**Preferred Solutions**:
- Prioritize using **Licia** utility library (already included in the project)
- Use existing project dependencies
- Use native JavaScript/TypeScript APIs
- Use Web Standard APIs

### 2. Dependency Check Process

Before writing code, choose solutions in the following priority:

1. **Licia Library** - Check if [licia.liriliri.io](https://licia.liriliri.io/) provides the required functionality
2. **Existing Dependencies** - Check existing dependencies in `package.json`
3. **Shared Code** - Check if `share/` directory has reusable components or tools
4. **Native Implementation** - Use native JavaScript/TypeScript APIs
5. **Ask Developer** - If none of the above works, ask if new dependencies can be introduced

## Tech Stack
* React 18
* MobX (mobx + mobx-react-lite)
* TypeScript
* Tailwind CSS
* Vite
* Electron
* i18next (Internationalization)
* **Licia** (Utility library - preferred)

## Project Structure Conventions

### Standard Plugin Directory Structure

**Basic Plugin** (No Node.js API required):
```
tinker-plugin-name/
├── src/
│   ├── App.tsx              # Main app component (use observer)
│   ├── main.tsx             # Entry file
│   ├── store.ts             # MobX Store (extends BaseStore)
│   ├── index.scss           # Global styles
│   ├── components/          # Components directory
│   │   └── ComponentName.tsx
│   ├── i18n/                # Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en-US.json
│   │       └── zh-CN.json
│   └── assets/              # Static assets (SVG icons, etc.)
├── index.html               # HTML entry
├── package.json             # Plugin configuration
└── icon.png                 # Plugin icon (required)
```

**Advanced Plugin** (Requires Node.js API like filesystem):
```
tinker-plugin-name/
├── src/
│   ├── preload/             # Electron Preload scripts
│   │   └── index.ts         # Expose secure Node.js APIs
│   └── renderer/            # Renderer process code
│       ├── App.tsx
│       ├── main.tsx
│       ├── store.ts
│       ├── components/
│       ├── i18n/
│       └── assets/
├── index.html
├── package.json
└── icon.png
```

Reference: `tinker-image-cropper`, `tinker-hosts`, `tinker-markdown-editor`

## Naming Conventions

### File and Directory Naming
- **Plugin Name**: kebab-case (`tinker-json-editor`, `tinker-code-image`)
- **Component Files**: PascalCase (`TextEditor.tsx`, `Toolbar.tsx`, `Frame.tsx`)
- **Store File**: `store.ts` (lowercase)
- **Style File**: `index.scss`
- **i18n Files**: `index.ts` and `locales/en-US.json`, `locales/zh-CN.json`

### Code Naming
- **Components**: PascalCase (`const Frame = observer(() => {...})`)
- **Functions/Variables**: camelCase (`setJsonInput`, `isDark`)
- **Constants**: UPPER_SNAKE_CASE (`const STORAGE_KEY = 'content'`)
- **Types/Interfaces**: PascalCase (`type EditorMode = 'text' | 'tree'`)

## State Management - MobX Pattern

### BaseStore Inheritance Pattern

All plugin Stores must extend `share/BaseStore.ts`:

```typescript
// src/store.ts
import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-plugin-name')
const STORAGE_KEY = 'data'

class Store extends BaseStore {
  // State properties
  someValue: string = ''

  constructor() {
    super() // Call parent constructor (initialize theme)
    makeAutoObservable(this) // Must explicitly call in subclass
    this.loadFromStorage() // Load persisted data
  }

  // Computed properties (use getter)
  get isEmpty() {
    return this.someValue.length === 0
  }

  // Actions (methods that modify state)
  setSomeValue(value: string) {
    this.someValue = value
    storage.set(STORAGE_KEY, value) // Persist
  }

  private loadFromStorage() {
    const saved = storage.get(STORAGE_KEY)
    if (saved) {
      this.someValue = saved
    }
  }
}

// Singleton export
export default new Store()
```

Reference: `tinker-json-editor/src/store.ts:16-178`

### Key Rules
1. **Must extend BaseStore**: Provides theme management and auto-listening
2. **Explicitly call makeAutoObservable**: Call in subclass constructor
3. **Singleton export**: `export default new Store()`
4. **Use getter for computed properties**: MobX automatically tracks dependencies
5. **Use LocalStore for persistence**: From licia library

## Component Design Patterns

### Entry File Template

```typescript
// src/main.tsx
import App from './App'
import { createRoot } from 'react-dom/client'
import './index.scss'
import i18n from './i18n'

function renderApp() {
  const container = document.getElementById('app') as HTMLElement
  createRoot(container).render(<App />)
}

;(async function () {
  // Get user language setting from tinker API
  const language = await tinker.getLanguage()
  i18n.changeLanguage(language)

  renderApp()
})()
```

### Component Writing Rules
1. **All components use observer**: `const Component = observer(() => {...})`
2. **Read state from store**: `store.property`
3. **Call store actions**: `store.action(value)`
4. **Props definition**: Use interface

## Shared Components Usage

The `share/` directory provides reusable components, BaseStore, and utilities.

**Available Components**:
- `Toolbar` / `ToolbarButton` - Toolbar components
- `Alert` / `Confirm` / `Prompt` - Dialog components
- `Select` / `Checkbox` / `ImageUpload` - Form components
- `Dialog` - General dialog

**Detailed Documentation**: See `share/README.md`

⚠️ **Important**: When updating components or tools in `plugins/share` directory, you must synchronously update the `share/README.md` documentation

## Tailwind CSS Style Conventions

### Color Conventions
```typescript
// Primary colors
'bg-[#0fc25e]'          // Primary green
'hover:bg-[#0db054]'    // Hover state

// Light mode backgrounds
'bg-[#f0f1f2]'          // Page background
'bg-white'              // Content background
'border-[#e0e0e0]'      // Border

// Dark mode backgrounds
'dark:bg-[#303133]'     // Page background
'dark:bg-[#1e1e1e]'     // Editor background
'dark:bg-[#3a3a3c]'     // Hover background
'dark:border-[#4a4a4a]' // Border
'dark:text-gray-200'    // Text
```

Reference: `share/components/Toolbar.tsx:10`, `tinker-code-image/src/components/Frame.tsx:12-13`

### Layout Patterns
```tsx
// Full-screen layout
<div className="h-screen flex flex-col">
  <Toolbar /> {/* Fixed height */}
  <div className="flex-1 overflow-hidden"> {/* Takes remaining space */}
    {/* Main content */}
  </div>
</div>

// Responsive dark mode
<div className="bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-200">
  Content
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

/* Third-party library style overrides */
.custom-library {
  /* Light mode */
  background: white;

  /* Dark mode */
  :is(.dark *) & {
    background: #1e1e1e;
  }
}
```

## TypeScript Conventions

### Type Definitions

**Local types** (defined in store.ts or component):
```typescript
type EditorMode = 'text' | 'tree'
interface DiffStats { additions: number; deletions: number }
```

**Global types**: Tinker API types are defined in `tinker.d.ts`

### Component Props Interface
```typescript
interface ComponentProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean // Optional property
}

export default observer(function Component({
  value,
  onChange,
  disabled = false // Default value
}: ComponentProps) {
  // ...
})
```

## Internationalization (i18n)

Use i18next for internationalization, supporting `en-US` and `zh-CN`.

### Basic Usage
```typescript
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
t('format')  // Translate key
t('lines', { count: 5 })  // With parameters
```

**Configuration**: `src/i18n/index.ts`, Translation files: `src/i18n/locales/{en-US,zh-CN}.json`

## Persistent Storage

Use `licia/LocalStore` for data persistence. See MobX Store pattern section for complete examples.

Reference: `tinker-json-editor/src/store.ts:14,64-70,73-74`

## Icons and Assets

### Lucide React Icon Library
```typescript
import {
  FileText,
  Copy,
  Trash,
  Download,
  Upload,
  Settings,
  Check,
  X
} from 'lucide-react'

<FileText size={14} />
<Copy size={TOOLBAR_ICON_SIZE} className="text-gray-600 dark:text-gray-300" />
```

**Common icon size**: `TOOLBAR_ICON_SIZE = 14`

### Custom SVG Icons
Use `vite-plugin-svgr` to import SVG as React components:

```typescript
// src/assets/custom-icon.svg
import CustomIcon from '../assets/custom-icon.svg?react'

<CustomIcon width={16} height={16} className="fill-current" />
```

Configuration is included in `vite.config.ts`.

## Preload Scripts (Advanced Plugins)

Use when Node.js API access is needed:

```typescript
// src/preload/index.ts
import { contextBridge } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

const apiName = 'pluginAPI' // Custom API name

const api = {
  async readFile(filePath: string): Promise<Buffer> {
    return fs.promises.readFile(filePath)
  },
  async writeFile(filePath: string, data: Uint8Array): Promise<void> {
    await fs.promises.writeFile(filePath, Buffer.from(data))
  },
  getFileName(filePath: string): string {
    return path.basename(filePath)
  },
  getDirName(filePath: string): string {
    return path.dirname(filePath)
  },
}

contextBridge.exposeInMainWorld(apiName, api)
```

**Type definitions**:
```typescript
// src/renderer/global.d.ts
declare global {
  interface Window {
    pluginAPI: {
      readFile(filePath: string): Promise<Buffer>
      writeFile(filePath: string, data: Uint8Array): Promise<void>
      getFileName(filePath: string): string
      getDirName(filePath: string): string
    }
  }
}

export {}
```

Reference: `tinker-image-cropper/src/preload/index.ts`

## Package.json Configuration

### Required Fields
```json
{
  "name": "tinker-plugin-name",
  "tinker": {
    "name": "Plugin Name",
    "icon": "icon.png",
    "main": "dist/index.html",  // Basic plugin
    "preload": "dist/preload/index.js",  // Advanced plugin (optional)
    "locales": {
      "zh-CN": { "name": "插件名称" }
    }
  }
}
```

Reference existing plugin `package.json` configurations.

## Tinker API

Tinker provides global `tinker` object to access system features.

**Available APIs**:
- `getTheme()` / `getLanguage()` - Get theme and language settings
- `showOpenDialog()` / `showSaveDialog()` - File dialogs
- `showItemInPath()` - Show file in file manager
- `showContextMenu()` - Show context menu
- `on()` - Event listener (theme/language changes)

**Detailed Documentation**: See TypeScript definitions and examples in `tinker.d.ts`

**Note**: BaseStore automatically handles theme management, no need to manually listen to `changeTheme` events

## Coding Best Practices

### 1. Single Responsibility Components
Each component is responsible for one functional module. Break complex features into multiple sub-components.

### 2. Store Method Naming
- `set*`: Directly set state (`setContent`, `setMode`)
- `toggle*`: Toggle boolean values (`toggleDarkMode`)
- `load*`: Load data from external sources (`loadFromFile`)
- `save*`: Save to external sources (`saveToFile`)
- `update*`: Update complex state (`updateUndoRedoState`)

### 3. Error Handling
Use try-catch to capture async operation errors. Use `alert()` to display error messages when necessary.

### 4. Performance Optimization
- Use MobX computed properties to cache calculation results
- Avoid creating new objects/arrays in render

### 5. Type Safety
- Avoid using `any`
- Use union types instead of strings: `type Mode = 'text' | 'tree'`
- Props must define interfaces

### 6. Style Consistency
- Use Tailwind class names and colors defined in documentation
- Support both light and dark modes: `bg-white dark:bg-[#1e1e1e]`

### 7. Prioritize Licia
Visit [Licia Official Documentation](https://licia.liriliri.io/) for complete function list. Prioritize using existing utility functions.

## New Plugin Creation Checklist

- [ ] Copy base structure from `tinker-template`
- [ ] Modify `name`, `description`, `tinker.name` in `package.json`
- [ ] Create or replace `icon.png` (plugin icon)
- [ ] Create Store extending BaseStore
- [ ] Setup i18n translations (en-US, zh-CN)
- [ ] Implement App component and sub-components
- [ ] Add Tailwind styles (light/dark mode)
- [ ] Manually check functionality and interactions
- [ ] Build test: `npm run build`

## Debugging Tips

- **MobX Debugging**: Use `autorun()` to monitor state changes
- **React DevTools**: Built-in support in Tinker, available in development mode

## Reference Plugin Examples

- **Simplest**: `tinker-timestamp` - Basic plugin structure
- **Medium Complexity**: `tinker-json-editor` - Dual editor mode
- **Complex**: `tinker-code-image` - Code screenshot generation
- **Preload**: `tinker-image-cropper` - Node.js API usage
- **File Operations**: `tinker-hosts` - Read/write system files

## Summary

Following these documentation rules ensures code consistency, maintainability, and user experience. Reference existing plugin implementations during development.
