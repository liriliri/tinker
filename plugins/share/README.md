# Shared Components and Utilities

This directory contains shared components, utility classes, and hooks for the Tinker plugin system.

## Directory Structure

```
share/
├── BaseStore.ts         # MobX Store base class
├── theme.ts             # Unified theme configuration
├── components/          # Shared UI components
│   ├── Alert.tsx
│   ├── Checkbox.tsx
│   ├── Confirm.tsx
│   ├── CopyButton.tsx
│   ├── Dialog.tsx
│   ├── ImageOpen.tsx
│   ├── Prompt.tsx
│   ├── Select.tsx
│   ├── Toolbar.tsx
│   ├── ToolbarButton.tsx
│   └── Tooltip.tsx
└── hooks/               # Shared React Hooks
    └── useCopyToClipboard.ts
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
tw.primary.bg              // bg-[#0fc25e] - Primary green background
tw.primary.bgHover         // hover:bg-[#0da84f] - Primary hover state
tw.primary.text            // text-[#0fc25e] - Primary text color
tw.primary.border          // border-[#0fc25e] - Primary border color
tw.primary.hoverBorder     // hover:border-[#0fc25e] - Primary hover border
tw.primary.focusBorder     // focus:border-[#0fc25e] - Primary focus border
tw.primary.focusRing       // focus:ring-[#0fc25e] - Primary focus ring
tw.primary.checkedBg       // group-data-[checked]:bg-[#0fc25e] - Checked background
tw.primary.checkedBorder   // group-data-[checked]:border-[#0fc25e] - Checked border
```

#### Background Colors
```typescript
// Light mode
tw.bg.light.primary     // bg-white
tw.bg.light.secondary   // bg-[#f0f1f2]
tw.bg.light.input       // bg-white

// Dark mode
tw.bg.dark.primary      // dark:bg-[#1e1e1e]
tw.bg.dark.secondary    // dark:bg-[#303133]
tw.bg.dark.tertiary     // dark:bg-[#252526]
tw.bg.dark.input        // dark:bg-[#2d2d2d]
tw.bg.dark.select       // dark:bg-[#3e3e42]
```

#### Border Utilities
```typescript
tw.border.light         // border-[#e0e0e0]
tw.border.dark          // dark:border-[#4a4a4a]
tw.border.both          // border-[#e0e0e0] dark:border-[#4a4a4a]
tw.border.bg            // bg-[#e0e0e0] dark:bg-[#4a4a4a] - For separators using background
```

#### Hover States
```typescript
tw.hover.light          // hover:bg-gray-200
tw.hover.dark           // dark:hover:bg-[#3a3a3c]
tw.hover.both           // hover:bg-gray-200 dark:hover:bg-[#3a3a3c]
```

#### Active States
```typescript
tw.active.light         // bg-gray-300
tw.active.dark          // dark:bg-[#4a4a4a]
tw.active.both          // bg-gray-300 dark:bg-[#4a4a4a]
```

#### Text Colors
```typescript
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
THEME_COLORS.bg.light.tertiary     // '#f3e5f5'
THEME_COLORS.bg.light.input        // '#ffffff'
THEME_COLORS.bg.light.select       // '#ffffff'
THEME_COLORS.bg.light.code         // '#252526'
THEME_COLORS.bg.dark.primary       // '#1e1e1e'
THEME_COLORS.bg.dark.secondary     // '#303133'
THEME_COLORS.bg.dark.tertiary      // '#252526'
THEME_COLORS.bg.dark.input         // '#2d2d2d'
THEME_COLORS.bg.dark.select        // '#3e3e42'
THEME_COLORS.bg.dark.code          // '#252526'

// Borders
THEME_COLORS.border.light          // '#e0e0e0'
THEME_COLORS.border.dark           // '#4a4a4a'

// Hover states
THEME_COLORS.hover.light           // '#e5e5e5'
THEME_COLORS.hover.dark            // '#3a3a3c'

// Active states
THEME_COLORS.active.light          // '#d5d5d5'
THEME_COLORS.active.dark           // '#4a4a4a'

// Text colors
THEME_COLORS.text.light.primary    // '#000000'
THEME_COLORS.text.light.secondary  // '#6b7280'
THEME_COLORS.text.light.tertiary   // '#9ca3af'
THEME_COLORS.text.dark.primary     // '#d4d4d4'
THEME_COLORS.text.dark.secondary   // '#9ca3af'
THEME_COLORS.text.dark.tertiary    // '#6b7280'
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

### Migration Guidelines

When updating existing code, always use theme utilities instead of hardcoded colors:

```typescript
// ❌ Bad - hardcoded colors
<button className="bg-[#0fc25e] hover:bg-[#0da84f]">
<div className="border-[#e0e0e0] dark:border-[#4a4a4a]">
<span className={copied ? 'text-[#0fc25e]' : ''}>

// ✅ Good - theme utilities
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
<div className={`border ${tw.border.both}`}>
<span className={copied ? tw.primary.text : ''}>
```

### CSS Variables (Advanced)

For integration with third-party libraries or complex custom styling:

```typescript
import { applyThemeVariables } from 'share/theme'

// Apply theme as CSS variables
applyThemeVariables()

// Use in CSS
.custom-element {
  background: var(--theme-bg-primary);
  border-color: var(--theme-border);
  color: var(--theme-text-primary);
}
```

**Note**: Most plugins should use Tailwind utilities (`tw.*`). CSS variables are only needed for special cases.

## BaseStore

All plugin Stores must extend `BaseStore`, which provides theme management functionality.

### Basic Usage

```typescript
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  input: string = ''
  uppercase: boolean = false

  constructor() {
    super() // Initialize BaseStore (theme management)
    makeAutoObservable(this) // Enable MobX reactivity
  }

  // Computed property
  get isEmpty() {
    return this.input.length === 0
  }

  // Actions
  setInput(value: string) {
    this.input = value
  }

  setUppercase(value: boolean) {
    this.uppercase = value
  }
}

const store = new Store()
export default store
```

### Key Rules

1. **Extend BaseStore**: All stores must extend `BaseStore` for theme management
2. **Call super() first**: Initialize BaseStore in constructor before other code
3. **Call makeAutoObservable()**: Enable MobX reactivity in subclass constructor
4. **Singleton pattern**: Export a single instance (`export default new Store()`)
5. **Use getters for computed properties**: MobX automatically tracks dependencies

### Theme Access

BaseStore provides `isDark` property that automatically updates when the theme changes:

```typescript
// In components with observer
const MyComponent = observer(() => {
  return (
    <div>
      Current theme: {store.isDark ? 'Dark' : 'Light'}
    </div>
  )
})
```

BaseStore listens to Tinker's `changeTheme` event and updates `isDark` automatically.

## Component Patterns

### Observer Wrapper

Use `observer` only for components that access store state:

```typescript
import { observer } from 'mobx-react-lite'

// ✅ Needs observer - reads from store
const Counter = observer(() => {
  return <div>Count: {store.count}</div>
})

// ✅ No observer needed - pure component
const Button = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>
}
```

### Props Interface

Always define component props with TypeScript interfaces:

```typescript
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean // Optional
}

export default observer(function MyComponent({
  value,
  onChange,
  disabled = false
}: MyComponentProps) {
  // ...
})
```

## Shared Components

### Toolbar

Provides consistent toolbar styling across plugins.

```typescript
import { Toolbar, ToolbarSeparator, ToolbarSpacer, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { Copy, Trash } from 'lucide-react'

export default observer(function MyToolbar() {
  return (
    <Toolbar>
      <ToolbarButton onClick={handleCopy}>
        <Copy size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        variant="toggle"
        active={store.isActive}
        onClick={() => store.toggleActive()}
      >
        Toggle
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton onClick={handleClear} disabled={store.isEmpty}>
        <Trash size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
```

**Components**:
- `Toolbar`: Container
- `ToolbarButton`: Button (supports `variant="toggle"` and `active` prop)
- `ToolbarSeparator`: Vertical separator line
- `ToolbarSpacer`: Flexible space (pushes following buttons to the right)
- `TOOLBAR_ICON_SIZE`: Standard icon size constant (14)

### Dialog Components

#### Alert

Display messages to users:

```typescript
import { alert } from 'share/components/Alert'

await alert({
  title: 'Error',
  message: 'Something went wrong!'
})
```

#### Confirm

Ask for user confirmation:

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

Get text input from user:

```typescript
import { prompt } from 'share/components/Prompt'

const value = await prompt({
  title: 'Enter name',
  defaultValue: 'Untitled'
})

if (value !== null) {
  // User entered value
}
```

**Required Setup**: Wrap your app with providers in `App.tsx`:

```typescript
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'

export default observer(function App() {
  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          {/* Your content */}
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
```

### Select

Dropdown select:

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

Checkbox with label:

```typescript
import Checkbox from 'share/components/Checkbox'

<Checkbox
  checked={store.isEnabled}
  onChange={(checked) => store.setEnabled(checked)}
  label="Enable feature"
/>
```

### CopyButton

Button with copy-to-clipboard functionality and visual feedback:

```typescript
import CopyButton from 'share/components/CopyButton'

// Default variant - standalone button with background
<CopyButton text="text to copy" title="Copy to clipboard" />

// Toolbar variant - for use in Toolbar components
<CopyButton
  variant="toolbar"
  text={store.jsonInput}
  disabled={store.isEmpty}
  title={t('copy')}
/>

// Icon variant - flexible styling for embedded use
<CopyButton
  variant="icon"
  text={entry.password}
  size={20}
  title="Copy password"
  className="absolute bottom-2 right-2 w-10 h-10"
/>

// Custom size and styling
<CopyButton
  text={data}
  size={18}
  className="px-4 py-3"
/>
```

**Props**:
- `text`: String to copy to clipboard (required)
- `variant`: Button style variant - `'default'`, `'icon'`, or `'toolbar'` (default: `'default'`)
  - `'default'`: Standalone button with padding and background
  - `'toolbar'`: Toolbar button style with hover effects (auto-uses TOOLBAR_ICON_SIZE)
  - `'icon'`: Icon-only button without default styling (for flexible embedding)
- `size`: Icon size in pixels (default: 16 for default/icon, 14 for toolbar)
- `title`: Tooltip text
- `className`: Additional CSS classes for button
- `iconClassName`: Additional CSS classes for icon (not applied when copied)
- Supports all standard button HTML attributes

**Features**:
- Automatic icon switching (Copy → Check)
- Visual feedback with primary color when copied
- Auto-resets after 2 seconds
- Built-in hover and theme support (default and toolbar variants)
- Flexible styling for various use cases (icon variant)

### ImageOpen

File drop zone for opening images:

```typescript
import ImageOpen from 'share/components/ImageOpen'

<ImageOpen
  onOpenImage={() => store.openImageDialog()}
  openTitle="Drop image here or click to open"
  supportedFormats="Supports PNG, JPG, WebP"
/>
```

### Tooltip

Smart tooltip with automatic viewport-aware positioning:

```typescript
import Tooltip from 'share/components/Tooltip'
import { useState } from 'react'

const MyComponent = () => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 })

  const handleMouseEnter = (event: React.MouseEvent) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY + 20,
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0 })
  }

  return (
    <>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        Hover me
      </div>
      <Tooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        content="Helpful tooltip"
      />
    </>
  )
}
```

**Props**:
- `content`: React content (text, JSX, or HTML)
- `x`, `y`: Position coordinates
- `visible`: Visibility toggle

**Features**:
- Auto-adjusts to stay within viewport
- Supports any React content
- Dark mode support
- Fade-in animation

## Shared Hooks

### useCopyToClipboard

Clipboard copy with visual feedback:

```typescript
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { Copy, Check } from 'lucide-react'
import { tw } from 'share/theme'

const MyComponent = () => {
  const { copied, copyToClipboard } = useCopyToClipboard()

  return (
    <button
      onClick={() => copyToClipboard('text to copy')}
      className={copied ? tw.primary.text : ''}
    >
      {copied ? <Check /> : <Copy />}
    </button>
  )
}
```

Auto-resets `copied` state after 2 seconds.

## Best Practices

### Performance

Use computed properties for cached calculations:

```typescript
class Store extends BaseStore {
  items: Item[] = []

  // Cached until dependencies change
  get activeItems() {
    return this.items.filter(x => x.active)
  }
}

// ✅ Good - uses computed property
<Component items={store.activeItems} />

// ❌ Bad - creates new array every render
<Component items={store.items.filter(x => x.active)} />
```

### Error Handling

Always handle errors in async operations:

```typescript
import { alert } from 'share/components/Alert'

async function handleSave() {
  try {
    await store.saveToFile()
  } catch (error) {
    console.error('Save failed:', error)
    await alert({
      title: 'Save Failed',
      message: 'Could not save file. Please try again.'
    })
  }
}
```

### Type Safety

1. Avoid `any` - use proper types
2. Use union types: `type Mode = 'text' | 'tree'`
3. Define interfaces for component props
4. Leverage TypeScript inference

## Quick Reference

- **Import path**: Use `share/` prefix (e.g., `import { tw } from 'share/theme'`)
- **Theme**: Always use `tw` or `THEME_COLORS` from `share/theme` - never hardcode colors
- **BaseStore**: All stores must extend `BaseStore` and call `super()` first
- **Observer**: Only wrap components that access store state
- **Dark mode**: All components support dark mode automatically
- **Examples**: See `tinker-hash`, `tinker-hex-editor` for reference implementations
