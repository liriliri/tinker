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
│   ├── lib/                 # External libraries and utility functions
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
│       ├── components/
│       ├── lib/             # External libraries and utility functions
│       └── ...
├── index.html
├── package.json
└── icon.png
```

Reference: `tinker-image-cropper`, `tinker-hosts`, `tinker-markdown-editor`

### Library and Utilities (`lib/` directory)

All external libraries, utility functions, and helper modules **must** be placed in `src/lib/`:

- External library wrappers
- Utility functions and helpers
- Business logic and algorithms
- Shared constants and configurations

Use `src/lib/`, not `src/utils/` or `src/helpers/`.

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

All plugin Stores **must extend** `share/BaseStore` for automatic theme management:

```typescript
import BaseStore from 'share/BaseStore'
import { makeAutoObservable } from 'mobx'

class Store extends BaseStore {
  constructor() {
    super()
    makeAutoObservable(this)
  }
}

export default new Store()
```

See `share/README.md` for detailed patterns, method naming conventions, and persistence.

## Component Patterns

1. **Use observer for components accessing store**: `const Component = observer(() => {...})`
2. **Props must have interface definitions**
3. **Avoid creating new objects/arrays in render** - use MobX computed properties

Entry file template: `src/main.tsx` initializes i18n with `tinker.getLanguage()` then renders App.

See `share/README.md` for detailed component patterns and examples.

## Shared Resources

- **BaseStore** - MobX Store base class with theme management
- **theme.ts** - Unified theme configuration (`tw`, `THEME_COLORS`)
- **Components**: Toolbar, ToolbarButton, Dialog, Alert, Confirm, Prompt, Select, Checkbox, CopyButton, ImageOpen, Tooltip
- **Hooks**: useCopyToClipboard

**Complete API documentation**: See `share/README.md`

**Important**: When updating `share/`, synchronously update `share/README.md`

## Tailwind CSS & Theme

**Always use theme utilities from `share/theme.ts`**. Never hardcode colors.

```typescript
import { tw, THEME_COLORS } from 'share/theme'

// Correct
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
<div className={tw.border}>

// Wrong
<button className="bg-[#0fc25e]">
<div className="border-[#e0e0e0]">
```

**Common patterns**:
- Full-screen layout: `<div className="h-screen flex flex-col">`
- Use `.both` variants for combined light/dark: `tw.bg.both.primary`, `tw.border`
- Copy success state: `className={copied ? tw.primary.text : ''}`

**Complete theme API**: See `share/README.md`

**Style files**: Only use SCSS for third-party library overrides. Use Tailwind for everything else.

## TypeScript

- Define local types inline: `type EditorMode = 'text' | 'tree'`
- Always define component props interfaces
- Avoid `any` - use proper types or union types
- Global types: See `tinker.d.ts` for Tinker API types

## Internationalization

```typescript
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()
t('format')  // Translate key
t('lines', { count: 5 })  // With parameters
```

Files: `src/i18n/index.ts`, `src/i18n/locales/{en-US,zh-CN}.json`

## Persistent Storage

Use `licia/LocalStore` for data persistence. Reference: `tinker-json-editor/src/store.ts:14,64-70,73-74`

## Icons

- **Lucide React**: `import { Copy } from 'lucide-react'` then `<Copy size={14} />`
- **Custom SVG**: `import Icon from '../assets/icon.svg?react'` then `<Icon width={16} height={16} />`
- **Toolbar icons**: Use `TOOLBAR_ICON_SIZE` constant (14px)

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

## Best Practices

1. **Single Responsibility** - Each component handles one functional module
2. **Error Handling** - Use try-catch for async operations, `alert()` for user-facing errors
3. **Performance** - Use MobX computed properties, avoid creating new objects in render
4. **Type Safety** - Avoid `any`, use union types, define props interfaces
5. **Theme Consistency** - Always use `tw` utilities from `share/theme`, never hardcode colors
6. **Prioritize Licia** - Check [licia.liriliri.io](https://licia.liriliri.io/) before implementing utilities
7. **Code Comments**:
   - Write all comments in English only
   - Avoid redundant comments that restate what code does
   - Comment the "why" not the "what"
   - Good: Explain non-obvious business logic, technical constraints, or workarounds
   - Bad: `// Set loading state` before `this.isLoading = true`
   - Bad: `// Update current color` before `setColor(color: string)`

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
