# Shared Components and Utilities

This directory contains shared components, utility classes, and Hooks for the Tinker plugin system.

## Directory Structure

```
share/
├── BaseStore.ts         # MobX Store base class
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
└── README.md           # This document

```

## BaseStore

All plugin Stores must extend `BaseStore`, which provides theme management functionality.

```typescript
import BaseStore from 'share/BaseStore'
import { makeAutoObservable } from 'mobx'

class Store extends BaseStore {
  constructor() {
    super() // Must call
    makeAutoObservable(this)
  }

  // Access theme state via this.isDark
}
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

## Usage Instructions

1. **Import Path**: Use `share/` as the import path prefix
2. **Type Definitions**: Most components export corresponding Props types
3. **Styling**: Components have built-in dark mode support
4. **Reference Implementation**: See existing plugins like `tinker-json-editor`, `tinker-code-image` for usage examples
