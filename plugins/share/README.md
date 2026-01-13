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

### Basic Usage

```typescript
import { tw, THEME_COLORS } from 'share/theme'

// Primary colors
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>Button</button>
<Copy className={copied ? tw.primary.text : ''} />

// Backgrounds (use .both for light/dark mode)
<div className={tw.bg.both.secondary}>Content</div>
<input className={tw.bg.both.input} />

// Borders
<div className={`border ${tw.border.both}`}>Content</div>

// Text colors
<span className={tw.text.both.primary}>Text</span>

// Hover and active states
<div className={`${tw.hover.both} ${isActive ? tw.active.both : ''}`}>Item</div>

// Inline styles (when needed)
<div style={{ borderColor: THEME_COLORS.primary }}>Content</div>
```

### Theme API

Use IDE autocomplete to discover all available utilities. Key patterns:

- **Primary**: `tw.primary.{bg, bgHover, text, border, focusBorder, checkedBg}`
- **Backgrounds**: `tw.bg.{light|dark|both}.{primary, secondary, tertiary, input, select, code}`
- **Borders**: `tw.border.{light, dark, both, bg}`
- **Text**: `tw.text.{light|dark|both}.{primary, secondary, tertiary}`
- **States**: `tw.{hover|active}.{light, dark, both}`

**Tip**: Always prefer `.both` variants for automatic light/dark mode support.

### Common Patterns

```typescript
// Success/copy state
<ToolbarButton className={copied ? tw.primary.text : ''}>
  {copied ? <Check /> : <Copy />}
</ToolbarButton>

// Primary action button
<button className={`px-3 py-1 ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded`}>
  Action
</button>

// Interactive list item
<div className={`px-3 py-2 cursor-pointer ${tw.hover.both} ${isSelected ? tw.active.both : ''}`}>
  Item
</div>

// Input field
<input className={`px-3 py-2 ${tw.bg.both.input} border ${tw.border.both} ${tw.primary.focusBorder}`} />
```

**Migration**: Replace hardcoded colors with theme utilities:
```typescript
// Bad
<button className="bg-[#0fc25e] hover:bg-[#0da84f]">

// Good
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`}>
```

## BaseStore

All plugin Stores must extend `BaseStore` for automatic theme management.

```typescript
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  input: string = ''

  constructor() {
    super() // Must call first
    makeAutoObservable(this)
  }

  get isEmpty() {
    return this.input.length === 0
  }

  setInput(value: string) {
    this.input = value
  }
}

export default new Store()
```

**Key points**:
- Call `super()` first in constructor
- Call `makeAutoObservable(this)` to enable MobX reactivity
- Export singleton instance
- Use getters for computed properties
- Access theme via `store.isDark` (auto-updates on theme change)

## Component Patterns

Use `observer` only for components that access store state:

```typescript
import { observer } from 'mobx-react-lite'

// Needs observer
const Counter = observer(() => <div>Count: {store.count}</div>)

// No observer needed
const Button = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
)
```

Always define component props with TypeScript interfaces:

```typescript
interface MyComponentProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
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

```typescript
import { Toolbar, ToolbarSeparator, ToolbarSpacer, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { Copy, Trash } from 'lucide-react'

<Toolbar>
  <ToolbarButton onClick={handleCopy}>
    <Copy size={TOOLBAR_ICON_SIZE} />
  </ToolbarButton>

  <ToolbarSeparator />

  <ToolbarButton variant="toggle" active={store.isActive} onClick={() => store.toggleActive()}>
    Toggle
  </ToolbarButton>

  <ToolbarSpacer />

  <ToolbarButton onClick={handleClear} disabled={store.isEmpty}>
    <Trash size={TOOLBAR_ICON_SIZE} />
  </ToolbarButton>
</Toolbar>
```

**Components**: `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarSpacer`, `TOOLBAR_ICON_SIZE` (14)

### Dialog Components

```typescript
import { alert } from 'share/components/Alert'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'

// Alert
await alert({ title: 'Error', message: 'Something went wrong!' })

// Confirm
const result = await confirm({ title: 'Delete', message: 'Are you sure?' })
if (result) { /* confirmed */ }

// Prompt
const value = await prompt({ title: 'Enter name', defaultValue: 'Untitled' })
if (value !== null) { /* user entered value */ }
```

**Setup**: Wrap app with providers in `App.tsx`:

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

### Select & Checkbox

```typescript
import Select, { SelectOption } from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'

const options: SelectOption[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
]

<Select
  value={store.selectedValue}
  onChange={(value) => store.setSelectedValue(value)}
  options={options}
/>

<Checkbox
  checked={store.isEnabled}
  onChange={(checked) => store.setEnabled(checked)}
  label="Enable feature"
/>
```

### CopyButton

```typescript
import CopyButton from 'share/components/CopyButton'

// Default variant
<CopyButton text="text to copy" title="Copy to clipboard" />

// Toolbar variant
<CopyButton variant="toolbar" text={store.jsonInput} disabled={store.isEmpty} />

// Icon variant (flexible styling)
<CopyButton
  variant="icon"
  text={entry.password}
  size={20}
  className="absolute bottom-2 right-2 w-10 h-10"
/>
```

**Props**: `text` (required), `variant` ('default' | 'icon' | 'toolbar'), `size`, `title`, `className`, `disabled`

**Features**: Auto icon switching (Copy → Check), visual feedback, auto-resets after 2s

### ImageOpen & Tooltip

```typescript
import ImageOpen from 'share/components/ImageOpen'
import Tooltip from 'share/components/Tooltip'

// Image drop zone
<ImageOpen
  onOpenImage={() => store.openImageDialog()}
  openTitle="Drop image here or click to open"
  supportedFormats="Supports PNG, JPG, WebP"
/>

// Tooltip with auto-positioning
const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 })

<div
  onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY + 20 })}
  onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0 })}
>
  Hover me
</div>
<Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} content="Helpful tooltip" />
```

## Shared Hooks

### useCopyToClipboard

```typescript
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { Copy, Check } from 'lucide-react'
import { tw } from 'share/theme'

const { copied, copyToClipboard } = useCopyToClipboard()

<button
  onClick={() => copyToClipboard('text to copy')}
  className={copied ? tw.primary.text : ''}
>
  {copied ? <Check /> : <Copy />}
</button>
```

Auto-resets `copied` state after 2 seconds.

## Best Practices

### Performance

Use computed properties for cached calculations:

```typescript
class Store extends BaseStore {
  items: Item[] = []

  get activeItems() {
    return this.items.filter(x => x.active) // Cached until dependencies change
  }
}

// Good
<Component items={store.activeItems} />

// Bad - creates new array every render
<Component items={store.items.filter(x => x.active)} />
```

### Error Handling

```typescript
import { alert } from 'share/components/Alert'

async function handleSave() {
  try {
    await store.saveToFile()
  } catch (error) {
    console.error('Save failed:', error)
    await alert({ title: 'Save Failed', message: 'Could not save file. Please try again.' })
  }
}
```

### Type Safety

- Avoid `any` - use proper types
- Use union types: `type Mode = 'text' | 'tree'`
- Define interfaces for component props
- Leverage TypeScript inference

## Quick Reference

- **Import**: Use `share/` prefix (e.g., `import { tw } from 'share/theme'`)
- **Theme**: Always use `tw` or `THEME_COLORS` - never hardcode colors
- **BaseStore**: All stores must extend `BaseStore` and call `super()` first
- **Observer**: Only wrap components that access store state
- **Examples**: See `tinker-hash`, `tinker-hex-editor` for reference implementations
