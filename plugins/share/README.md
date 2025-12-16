# Shared Components and Utilities

This directory contains shared components, utility classes, and Hooks for the Tinker plugin system.

## Directory Structure

```
share/
├── BaseStore.ts         # MobX Store base class
├── theme.ts             # Unified theme configuration
├── components/          # Shared UI components
│   ├── Toolbar.tsx
│   ├── ToolbarButton.tsx
│   ├── Alert.tsx
│   ├── Confirm.tsx
│   ├── Prompt.tsx
│   ├── Dialog.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   └── ImageUpload.tsx
├── hooks/               # Shared React Hooks
│   └── useCopyToClipboard.ts
└── README.md           # This document

```

## Theme Configuration

**All plugins must use the unified theme configuration from `share/theme.ts`**.

This provides a centralized way to manage colors and styles across all plugins, ensuring consistency and making theme updates easier.

### Import and Usage

```typescript
import { tw, THEME_COLORS } from 'share/theme'

// Use predefined Tailwind class names
<button className={tw.primary.bg}>Primary Button</button>
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
  With Hover
</button>

// Copy success state (common pattern)
<Copy className={copied ? tw.primary.text : ''} />

// Border and background utilities
<div className={`border ${tw.border.both}`}>Content</div>
<div className={`${tw.bg.light.secondary} ${tw.bg.dark.secondary}`}>
  Background
</div>

// Hover states
<button className={tw.hover.both}>Hover Button</button>

// Use color constants for inline styles
<div style={{ borderColor: THEME_COLORS.primary }}>Content</div>
```

### Complete API Reference

#### Primary Colors
```typescript
tw.primary.bg           // bg-[#0fc25e] - Primary green background
tw.primary.bgHover      // hover:bg-[#0da84f] - Primary hover state
tw.primary.text         // text-[#0fc25e] - Primary text color
tw.primary.border       // border-[#0fc25e] - Primary border color
tw.primary.focusBorder  // focus:border-[#0fc25e] - Primary focus border
```

#### Background Colors
```typescript
// Light mode
tw.bg.light.primary     // bg-white
tw.bg.light.secondary   // bg-[#f0f1f2]
tw.bg.light.tertiary    // bg-[#f3e5f5]
tw.bg.light.input       // bg-white
tw.bg.light.select      // bg-white
tw.bg.light.code        // bg-[#252526]

// Dark mode
tw.bg.dark.primary      // dark:bg-[#1e1e1e]
tw.bg.dark.secondary    // dark:bg-[#303133]
tw.bg.dark.tertiary     // dark:bg-[#252526]
tw.bg.dark.input        // dark:bg-[#2d2d2d]
tw.bg.dark.select       // dark:bg-[#3e3e42]
tw.bg.dark.code         // dark:bg-[#252526]
```

#### Border, Hover and Active States
```typescript
// Borders - combined light and dark
tw.border.both          // border-[#e0e0e0] dark:border-[#4a4a4a]
tw.border.light         // border-[#e0e0e0]
tw.border.dark          // dark:border-[#4a4a4a]

// Hover states - combined light and dark
tw.hover.both           // hover:bg-gray-200 dark:hover:bg-[#3a3a3c]
tw.hover.light          // hover:bg-gray-200
tw.hover.dark           // dark:hover:bg-[#3a3a3c]

// Active states - combined light and dark
tw.active.both          // bg-gray-300 dark:bg-[#4a4a4a]
tw.active.light         // bg-gray-300
tw.active.dark          // dark:bg-[#4a4a4a]

// Text colors
tw.text.light.primary   // text-gray-800
tw.text.light.secondary // text-gray-600
tw.text.light.tertiary  // text-gray-500
tw.text.dark.primary    // dark:text-gray-200
tw.text.dark.secondary  // dark:text-gray-300
tw.text.dark.tertiary   // dark:text-gray-400
```

### Color Constants

For inline styles or direct color access:

```typescript
// Primary colors
THEME_COLORS.primary          // '#0fc25e'
THEME_COLORS.primaryHover     // '#0da84f'
THEME_COLORS.success          // '#0fc25e'

// Background colors
THEME_COLORS.bg.light.primary      // '#ffffff'
THEME_COLORS.bg.light.secondary    // '#f0f1f2'
THEME_COLORS.bg.dark.primary       // '#1e1e1e'
THEME_COLORS.bg.dark.secondary     // '#303133'

// Borders
THEME_COLORS.border.light     // '#e0e0e0'
THEME_COLORS.border.dark      // '#4a4a4a'

// Hover states
THEME_COLORS.hover.light      // '#e5e5e5'
THEME_COLORS.hover.dark       // '#3a3a3c'

// Text colors
THEME_COLORS.text.light.primary    // '#000000'
THEME_COLORS.text.dark.primary     // '#d4d4d4'
// ... and more
```

### Common Usage Patterns

#### Success/Copy State
```typescript
import { tw } from 'share/theme'
import { Copy, Check } from 'lucide-react'

<ToolbarButton
  onClick={handleCopy}
  className={copied ? tw.primary.text : ''}
>
  {copied ? <Check /> : <Copy />}
</ToolbarButton>
```

#### Primary Action Button
```typescript
<button
  onClick={handleAction}
  className={`px-3 py-1 text-xs ${tw.primary.bg} ${tw.primary.bgHover} text-white font-medium rounded transition-colors`}
>
  Action
</button>
```

#### Interactive List Item
```typescript
<div
  className={`px-3 py-2 cursor-pointer ${tw.hover.both} ${
    isSelected ? tw.active.both : ''
  }`}
>
  List Item
</div>
```

#### Input Field
```typescript
<input
  className={`px-3 py-2 ${tw.bg.light.input} ${tw.bg.dark.input} border ${tw.border.both} focus:outline-none ${tw.primary.focusBorder}`}
/>
```

### Migration from Hardcoded Colors

When updating existing code, replace hardcoded colors with theme utilities:

**Don't hardcode colors**:
```typescript
<button className="bg-[#0fc25e] hover:bg-[#0da84f]">
<div className="border-[#e0e0e0] dark:border-[#4a4a4a]">
<span className={copied ? 'text-[#0fc25e]' : ''}>
```

**Use theme utilities**:
```typescript
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
<div className={tw.border.both}>
<span className={copied ? tw.primary.text : ''}>
```

### Advanced: CSS Variables

For non-Tailwind scenarios, you can apply theme as CSS variables:

```typescript
import { applyThemeVariables } from 'share/theme'

// Call once when theme changes
applyThemeVariables()

// Then use in CSS
.custom-element {
  background: var(--theme-bg-primary);
  border-color: var(--theme-border);
  color: var(--theme-text-primary);
}
```

**Note**: Most plugins should use Tailwind utilities. CSS variables are only needed for third-party libraries or complex custom styling.

### References

- Full implementation: `share/theme.ts`
- Usage examples: `tinker-code-image/src/components/Toolbar.tsx`, `tinker-hosts/src/renderer/components/Sidebar.tsx`

## BaseStore

All plugin Stores must extend `BaseStore`, which provides theme management functionality.

### Basic Usage

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
3. **Call super() first**: Initialize theme management from BaseStore
4. **Singleton export**: `export default new Store()`
5. **Use getter for computed properties**: MobX automatically tracks dependencies
6. **Use LocalStore for persistence**: From licia library

### Theme Access

BaseStore provides a reactive `isDark` property:

```typescript
class Store extends BaseStore {
  constructor() {
    super()
    makeAutoObservable(this)
  }

  // Access theme state
  get currentTheme() {
    return this.isDark ? 'dark' : 'light'
  }
}

// In components (with observer)
const MyComponent = observer(() => {
  return (
    <div>
      Current theme: {store.isDark ? 'Dark' : 'Light'}
    </div>
  )
})
```

BaseStore automatically listens to Tinker's `changeTheme` event and updates `isDark` accordingly.

### Store Method Naming Conventions

Follow these naming patterns for store methods:

- `set*`: Directly set state (`setContent`, `setMode`)
- `toggle*`: Toggle boolean values (`toggleDarkMode`)
- `load*`: Load data from external sources (`loadFromFile`)
- `save*`: Save to external sources (`saveToFile`)
- `update*`: Update complex state (`updateUndoRedoState`)

## Component Design Patterns

### Observer Pattern

Only components that read from or react to store state need the `observer` wrapper. Pure presentation components without store access don't need it.

```typescript
import { observer } from 'mobx-react-lite'

// Component that uses store - needs observer
const Counter = observer(() => {
  return <div>Count: {store.count}</div>
})

// Pure component - no observer needed
const Button = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>
}
```

### Component Props

Always define props using interfaces:

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
  // Component implementation
})
```

## Shared Components

### Toolbar Component

Toolbar component that provides consistent toolbar styling.

```typescript
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { FileText, Copy, Trash } from 'lucide-react'

export default observer(function MyToolbar() {
  return (
    <Toolbar>
      <ToolbarButton onClick={handleAction}>
        <FileText size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        variant="toggle"
        active={store.isActive}
        onClick={() => store.toggleActive()}
      >
        <Copy size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton onClick={handleClear} disabled={store.isEmpty}>
        <Trash size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
```

**Component Description**:
- `Toolbar`: Toolbar container
- `ToolbarButton`: Toolbar button, supports `variant="toggle"` for toggle style
- `ToolbarSeparator`: Separator line
- `ToolbarSpacer`: Flexible space to push subsequent buttons to the right
- `TOOLBAR_ICON_SIZE`: Standard icon size (14)

### Dialog, Alert, Confirm, Prompt

Dialog components for user interaction.

#### Alert

Display informational messages:

```typescript
import { alert } from 'share/components/Alert'

await alert({
  title: 'Error',
  message: 'Something went wrong!'
})
```

#### Confirm

Confirmation dialog:

```typescript
import { confirm } from 'share/components/Confirm'

const result = await confirm({
  title: 'Delete',
  message: 'Are you sure?'
})

if (result) {
  // User confirmed
}
```

#### Prompt

Input dialog:

```typescript
import { prompt } from 'share/components/Prompt'

const value = await prompt({
  title: 'Enter name',
  defaultValue: 'Untitled'
})

if (value !== null) {
  // User entered content
}
```

**Important**: Must wrap with Providers in App.tsx:

```typescript
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'

const App = observer(() => {
  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          {/* Your app content */}
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
```

### Select

Dropdown select component:

```typescript
import Select, { SelectOption } from 'share/components/Select'

const options: SelectOption[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
]

<Select
  value={store.selectedValue}
  onChange={(value) => store.setSelectedValue(value)}
  options={options}
/>
```

### Checkbox

Checkbox component:

```typescript
import Checkbox from 'share/components/Checkbox'

<Checkbox
  checked={store.isEnabled}
  onChange={(checked) => store.setEnabled(checked)}
  label="Enable feature"
/>
```

### ImageUpload

Image upload component:

```typescript
import ImageUpload from 'share/components/ImageUpload'

<ImageUpload
  onImageSelect={(file) => handleImageFile(file)}
/>
```

## Shared Hooks

### useCopyToClipboard

A hook for handling clipboard copy operations with visual feedback.

```typescript
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { Copy, Check } from 'lucide-react'
import { tw } from 'share/theme'

const MyComponent = () => {
  const { copied, copyToClipboard } = useCopyToClipboard()

  const handleCopy = async () => {
    await copyToClipboard('text to copy')
  }

  return (
    <button
      onClick={handleCopy}
      className={copied ? tw.primary.text : ''}
    >
      {copied ? <Check /> : <Copy />}
    </button>
  )
}
```

The hook automatically resets the `copied` state after 2 seconds.

## Best Practices

### Performance Optimization

1. **Use MobX computed properties** to cache calculation results:
```typescript
class Store extends BaseStore {
  items: Item[] = []

  // Computed property - cached until dependencies change
  get itemCount() {
    return this.items.length
  }

  get expensiveCalculation() {
    return this.items.reduce((sum, item) => sum + item.value, 0)
  }
}
```

2. **Avoid creating new objects/arrays in render**:
```typescript
// Bad - creates new array every render
<Component items={store.items.filter(x => x.active)} />

// Good - use computed property
class Store extends BaseStore {
  get activeItems() {
    return this.items.filter(x => x.active)
  }
}
<Component items={store.activeItems} />
```

### Error Handling

Use try-catch for async operations and show user-friendly error messages:

```typescript
import { alert } from 'share/components/Alert'

async function handleSave() {
  try {
    await store.saveToFile()
  } catch (error) {
    console.error('Failed to save:', error)
    await alert({
      title: 'Save Failed',
      message: 'Could not save the file. Please try again.'
    })
  }
}
```

### Type Safety

1. Avoid using `any` - use proper types
2. Use union types for string literals: `type Mode = 'text' | 'tree'`
3. Always define interfaces for component props
4. Leverage TypeScript's type inference when possible

## Usage Instructions

1. **Import Path**: Use `share/` as the import path prefix
2. **Theme**: Always import and use `tw` or `THEME_COLORS` from `share/theme` instead of hardcoding colors
3. **BaseStore**: All stores must extend BaseStore and call super() in constructor
4. **Observer**: Only wrap components that read from store with observer
5. **Type Definitions**: Most components export corresponding Props types
6. **Styling**: Components have built-in dark mode support
7. **Reference Implementation**: See existing plugins like `tinker-json-editor`, `tinker-code-image` for usage examples

## Maintenance

**Important**: When adding or updating components, utilities, or patterns in `plugins/share`, you must:
1. Update this README.md with complete documentation
2. Add usage examples
3. Document any breaking changes
4. Test across multiple plugins to ensure compatibility
