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

## Theme Configuration

Use unified theme from `share/theme.ts`:

```typescript
import { tw, THEME_COLORS } from 'share/theme'

// Primary colors
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
<Copy className={copied ? tw.primary.text : ''} />
<span className={`${tw.text.primary} ${tw.primary.textHover}`}>Hover me</span>

// Backgrounds & Borders
<div className={tw.bg.secondary}>Content</div>
<input className={`${tw.bg.input} border ${tw.border}`} />

// States
<div className={`${tw.hover} ${isActive ? tw.active : ''}`} />
```

**Key patterns**: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.text.{primary|secondary|tertiary}`, `tw.hover`, `tw.active`.

## BaseStore

All plugin stores must extend `BaseStore`:

```typescript
import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  input: string = ''

  constructor() {
    super()
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

**Key**: Call `super()` first, then `makeAutoObservable(this)`. Access theme via `store.isDark`.

## Component Patterns

Use `observer` for components accessing store:

```typescript
import { observer } from 'mobx-react-lite'

const Counter = observer(() => <div>{store.count}</div>)

interface ButtonProps {
  onClick: () => void
  disabled?: boolean
}

const Button = ({ onClick, disabled = false }: ButtonProps) => (
  <button onClick={onClick} disabled={disabled}>Click</button>
)
```

## Shared Components

### Toolbar

```typescript
import { Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSpacer, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { Copy } from 'lucide-react'

<Toolbar>
  <ToolbarButton onClick={handleCopy}>
    <Copy size={TOOLBAR_ICON_SIZE} />
  </ToolbarButton>
  <ToolbarSeparator />
  <ToolbarButton variant="toggle" active={store.isActive} onClick={() => store.toggle()}>
    Toggle
  </ToolbarButton>
  <ToolbarSpacer />
  <ToolbarButton menu={[{ label: 'Action', click: handleAction }]}>
    Menu
  </ToolbarButton>
</Toolbar>
```

**ToolbarButton Props**: `variant` ('action' | 'toggle'), `active`, `menu`, `longPressDuration`

### Dialog Components

```typescript
import { alert } from 'share/components/Alert'
import { confirm } from 'share/components/Confirm'
import { prompt } from 'share/components/Prompt'

await alert({ title: 'Error', message: 'Failed!' })
const ok = await confirm({ title: 'Delete', message: 'Sure?' })
const value = await prompt({ title: 'Name', defaultValue: 'Untitled' })
```

Setup in `App.tsx`:

```typescript
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'

export default observer(function App() {
  const { i18n } = useTranslation()
  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          {/* content */}
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
```

### Toaster

```typescript
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'

export default function App() {
  return <ToasterProvider>{/* content */}</ToasterProvider>
}

toast.success('Saved')
toast.error('Failed')
```

### Form Components

```typescript
import Select, { SelectOption } from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import Slider from 'share/components/Slider'

<Select value={store.value} onChange={store.setValue} options={options} />
<Checkbox checked={store.enabled} onChange={store.setEnabled} label="Enable" />
<Slider min={0} max={100} value={store.size} onChange={store.setSize} disabled={!store.enabled} />
```

### Other Components

```typescript
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import ImageOpen from 'share/components/ImageOpen'
import Tooltip from 'share/components/Tooltip'
import Tree, { TreeNodeData } from 'share/components/Tree'

// Copy button variants
<CopyButton text="copy me" title="Copy" />
<CopyButton variant="toolbar" text={store.text} disabled={store.isEmpty} />
<CopyButton variant="icon" text={data} size={20} className="custom-style" />

// File open
<FileOpen
  onOpenFile={(file) => store.handleFile(file)}
  openTitle={t('openFile')}
  supportedFormats="PNG, JPG"
  fileName={store.fileName}
/>

// Image drop zone
<ImageOpen
  onOpenImage={() => store.openImage()}
  openTitle="Drop image or click"
  supportedFormats="PNG, JPG, WebP"
/>

// Tooltip
<Tooltip visible={show} x={x} y={y} content="Hint" />

// Tree - Generic tree view with expand/collapse and highlighting
interface MyNode extends TreeNodeData {
  customField: string
}

<Tree<MyNode>
  data={treeData}
  onNodeClick={(node) => handleClick(node)}
  activeNodeId={activeId}
  emptyText="No data"
/>
```

## Shared Hooks

### useCopyToClipboard

```typescript
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'

const { copied, copyToClipboard } = useCopyToClipboard()

<button onClick={() => copyToClipboard('text')} className={copied ? tw.primary.text : ''}>
  {copied ? <Check /> : <Copy />}
</button>
```

Auto-resets `copied` after 2 seconds.

## Shared Utilities

### openImageFile

```typescript
import { openImageFile } from 'share/lib/util'

const result = await openImageFile({ title: 'Open Image' })
if (result) {
  store.loadImage(result.file, result.filePath)
}
```

Opens native file dialog for images. Returns `{ file: File, filePath: string } | null`.

## Best Practices

**Performance**: Use computed properties for cached calculations.

```typescript
class Store extends BaseStore {
  items: Item[] = []
  get activeItems() {
    return this.items.filter(x => x.active) // Cached
  }
}
```

**Error Handling**: Use try-catch with dialogs.

```typescript
try {
  await store.save()
} catch (error) {
  await alert({ title: 'Failed', message: 'Could not save.' })
}
```

**Type Safety**: Avoid `any`, use union types, define prop interfaces.

## Quick Reference

- **Import**: Use `share/` prefix (e.g., `import { tw } from 'share/theme'`)
- **Theme**: Always use `tw` or `THEME_COLORS` - never hardcode colors
- **BaseStore**: All stores must extend `BaseStore` and call `super()` first
- **Observer**: Only wrap components that access store state
- **Examples**: See `tinker-hash`, `tinker-hex-editor` for reference
