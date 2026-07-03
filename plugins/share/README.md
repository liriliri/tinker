# Shared Components and Utilities

Tinker plugins should reuse shared UI, store, and AI logic instead of rebuilding.

## Quick Rules

- Import `share/base.scss` in plugin `index.scss`.
- Use `tw` utilities from `share/theme.ts`; do not hardcode colors.
- Plugin stores extend `BaseStore`, call `super()` first, then `makeAutoObservable(this)`.
- `share/components/AiChat` is display-only. State and actions stay in the caller.
- `share/lib/Agent` owns AI message state, tool-call loops, and streaming.

## Base Styles

```scss
// src/index.scss (use src/renderer/index.scss for preload plugins)
@use '../../share/base.scss';
@config "../tailwind.config.js";
```

Third-party style overrides live in `share/styles/`. For OverlayScrollbars, import `share/styles/overlayscrollbars.scss` and use `share/components/OverlayScrollbars`.

## Theme

```ts
import { tw } from 'share/theme'

<div className={tw.bg.secondary} />
<span className={tw.text.primary} />
<button className={`${tw.primary.bg} ${tw.primary.bgHover}`} />
```

Common tokens: `tw.primary.*`, `tw.bg.*`, `tw.border`, `tw.text.*`, `tw.hover`, `tw.active`.

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

## Components

### Toolbar

```ts
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarSearch,
} from 'share/components/Toolbar'
```

### Dialogs & Toaster

```ts
import { alert, AlertProvider } from 'share/components/Alert'
import { confirm, ConfirmProvider } from 'share/components/Confirm'
import { prompt, PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import toast from 'react-hot-toast'
```

Wrap `App.tsx` with providers. Use `toast` directly for toasts.

### ScanDirsModal

```ts
import ScanDirsModal from 'share/components/ScanDirsModal'
```

### Form

```ts
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import Slider from 'share/components/Slider'
```

### OverlayScrollbars

Import `share/styles/overlayscrollbars.scss` in plugin `index.scss`, then:

```ts
import OverlayScrollbars, {
  type OverlayScrollbarsRef,
} from 'share/components/OverlayScrollbars'

const scrollRef = useRef<OverlayScrollbarsRef>(null)

<OverlayScrollbars
  ref={scrollRef}
  className="h-full"
  onViewportChange={setScrollViewport}
>
  {children}
</OverlayScrollbars>
```

### AiChat

Translations register automatically in the `aiChat` i18n namespace when this module is imported. Plugins should not call this namespace directly; use the components below instead.

```ts
import {
  MessageList,
  ChatInputArea,
  ChatClearButton,
  MarkdownContent,
  SearchCard,
  type ChatMessage,
} from 'share/components/AiChat'
```

Render-only. Provide `messages`, send/retry/delete handlers, and session logic. Use `getSearchCardProps(toolMsg)` for `SearchCard`. Pass `onSystemPromptChange` to `ChatInputArea` when system prompt editing is needed. Override `emptyHint` or `placeholder` for plugin-specific copy.

### TextSearch

```ts
import TextSearchSidebar, {
  getTextSearchUIProps,
} from 'share/components/TextSearch'
import TextSearch from 'share/lib/textSearch'

const search = new TextSearch({ storageNamespace: 'my-plugin-search' })

<TextSearchSidebar
  {...getTextSearchUIProps(search)}
  onSelectMatch={(m) => openInEditor(m.path, m.lineNumber, m.submatches)}
/>
```

Add `@use '../../share/styles/textSearch.scss'` for highlight classes.

### WorkingTree

```ts
import WorkingTreeSidebar, {
  getWorkingTreeUIProps,
} from 'share/components/WorkingTree'

;<WorkingTreeSidebar {...getWorkingTreeUIProps(store)} />
```

Implement `WorkingTreeController` on your store. Helpers in `share/lib/workingTree`.

### Welcome

```ts
import Welcome, { type WelcomeAction } from 'share/components/Welcome'

const actions: WelcomeAction[] = [
  { icon: <Plus size={20} />, label: t('newFile'), onClick: handleNew },
  { icon: <FolderOpen size={20} />, label: t('openFile'), onClick: handleOpen },
]

<Welcome
  title={t('welcomeTitle')}
  description={t('welcomeDescription')}
  actions={actions}
  recentFiles={store.recentFiles}
  onOpenRecent={(path) => store.openFile(path)}
  onRemoveRecent={(path) => store.removeRecentFile(path)}
/>
```

### FileIcon

```ts
import FileIcon from 'share/components/FileIcon'

;<FileIcon name="app.tsx" isDark={store.isDark} size={18} />
```

### Terminal

```ts
import Terminal, { getTerminalSession } from 'share/components/Terminal'
```

```ts
<Terminal
  createSession={(cols, rows) => tinker.createTerminal({ cols, rows })}
/>
```

### TerminalPanel

Multi-tab, split-pane terminal panel:

```ts
import Terminal from 'share/store/Terminal'
import { TerminalPanel } from 'share/components/TerminalPanel'

// In store:
this.terminal = new Terminal('my-plugin', () => this.rootPath)
this.terminal.initIfOpen()

// In layout:
{
  store.terminalOpen && (
    <TerminalPanel terminal={store.terminal} isDark={store.isDark} />
  )
}
```

### FileTree

```ts
import FileTree, {
  type ITreeNode,
  type IFileTreeDataSource,
} from 'share/components/FileTree'

const dataSource: IFileTreeDataSource = {
  readDir: async (path) => codeEditor.readDir(path),
  createNode: async (parentPath, name, type) => { /* create */ },
  renameNode: async (oldPath, newPath) => { /* rename */ },
  deleteNode: async (path) => { /* delete */ },
}

<FileTree
  nodes={tree}
  rootPath={rootPath}
  dataSource={dataSource}
  onOpenFile={(path, name) => openFile(path, name)}
  getRootContextMenu={() => [/* optional blank-area menu items */]}
/>
```

Pass `rootPath` to enable a blank-area context menu with built-in New File / New Folder actions at the project root.

````

File watching is the consumer's responsibility — use `onExpandChange`, `refreshDirs`, and `refreshVersion`.

### FileList

File browser with list and grid view modes. Supports multi-select, sorting, context menus, and Ctrl/Cmd+A select-all. Pass `renderIcon` for custom entry icons.

```ts
import FileList from 'share/components/FileList'

<FileList
  viewMode={viewMode}
  isDark={isDark}
  entries={entries}
  selectedPaths={selectedPaths}
  sortMethod={sortMethod}
  sortOrder={sortOrder}
  loading={loading}
  error={error}
  isFiltering={isFiltering}
  currentPath={currentPath}
  selectAllActive={active}
  onSelectAll={selectAll}
  renderIcon={(entry) => <FileEntryIcon {...entry} />}
  onSelect={handleSelect}
  onActivate={handleActivate}
  onSort={handleSort}
  onEntryContextMenu={showEntryMenu}
  onBlankContextMenu={showBlankMenu}
/>
```

### PathBar

Collapsible path breadcrumb bar with ellipsis menu for hidden segments. Pass pre-built segments and an optional `formatSegment` callback for custom labels (e.g. favorite place names). Export `PathBarItem` for building segment lists.

```ts
import PathBar from 'share/components/PathBar'
import { buildPathBreadcrumbs } from '../lib/util'

<PathBar
  path={currentPath}
  items={buildPathBreadcrumbs(currentPath)}
  onNavigate={navigate}
  onEdit={() => setEditingPath(true)}
  formatSegment={(item) => item.name}
/>
```

### FilePreview

Side panel file preview with metadata. Images use `ImageViewer` (zoom, pan, rotate via context menu). Videos require the videojs vendor script. PDFs require the pdfjs vendor script. Markdown requires the markdown and syntaxhighlighter vendor scripts.

```ts
import FilePreview from 'share/components/FilePreview'

<FilePreview path={selectedFilePath} />
```

### PhotoViewer

Full-screen photo viewer. Items need `id`, `title`, `width`, `height`; image URLs via `getThumbnailUrl` / `getPreviewUrl`. Preview zoom/pan uses Canvas 2D rendering. Optional `renderSidebar`, `prefetchPreview`.

```ts
import PhotoViewer from 'share/components/PhotoViewer'

<PhotoViewer
  open={open}
  items={photos}
  currentIndex={index}
  onClose={onClose}
  onIndexChange={setIndex}
  labels={labels}
  getThumbnailUrl={getThumbnailUrl}
  getPreviewUrl={getPreviewUrl}
/>
```

### PdfViewer

PDF renderer. The default export is a controlled viewer that renders pages to canvas with lazy loading, zoom, and keyboard shortcuts. Requires the `pdfjs` vendor script in `index.html`. Also exports `Thumbnail` and `Outline` atoms for plugins that want to build their own sidebar layout.

```ts
import PdfViewer, { Thumbnail, Outline } from 'share/components/PdfViewer'

<PdfViewer
  pdfDoc={pdfDoc}
  loading={isLoading}
  scale={scale}
  onScaleChange={(s, isUser) => setScale(s, isUser)}
  onCurrentPageChange={setCurrentPage}
  scrollToPage={scrollToPage}
  enableKeyboardShortcuts
  onPrevPage={prevPage}
  onNextPage={nextPage}
  onZoomIn={zoomIn}
  onZoomOut={zoomOut}
  onResetZoom={resetZoom}
/>

// Build a custom sidebar using the shared atoms:
<Thumbnail
  pageNum={1}
  pdfDoc={pdfDoc}
  scale={scale}
  isActive={currentPage === 1}
  onClick={() => setCurrentPage(1)}
/>
<Outline
  pdfDoc={pdfDoc}
  numPages={numPages}
  onSetCurrentPage={setCurrentPage}
  onSetScrollToPage={(p) => { scrollToPage = p }}
/>
```

### MarkdownPreview

Markdown renderer with GFM support and syntax highlighting. Requires `markdown.js` and `syntaxhighlighter.js` vendor scripts.

```ts
import MarkdownPreview from 'share/components/MarkdownPreview'

<MarkdownPreview
  content={markdown}
  isDark={isDark}
  scrollPercent={scrollPercent}
  onScrollPercentChange={setScrollPercent}
/>
```

`scrollPercent` and `onScrollPercentChange` are optional. When both are provided, the preview syncs scroll position with a paired editor.

### Other Components

```ts
import CopyButton from 'share/components/CopyButton'
import FileOpen from 'share/components/FileOpen'
import FolderOpen from 'share/components/FolderOpen'
import ImageOpen from 'share/components/ImageOpen'
import ImageViewer from 'share/components/ImageViewer'
import MarkdownPreview from 'share/components/MarkdownPreview' // requires markdown + syntaxhighlighter vendor
import PdfViewer from 'share/components/PdfViewer' // requires pdfjs vendor
import PhotoViewer from 'share/components/PhotoViewer'
import FilePreview from 'share/components/FilePreview'
import FileList from 'share/components/FileList'
import PathBar from 'share/components/PathBar'
import Tooltip from 'share/components/Tooltip'
import NavList from 'share/components/NavList'
import Tree from 'share/components/Tree'
import Grid from 'share/components/Grid'
import HexEditor from 'share/components/HexEditor' // requires react-hex-editor vendor
import VideoPlayer from 'share/components/VideoPlayer' // requires videojs vendor
```

## Hooks

```ts
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { useInView } from 'share/hooks/useInView'
```

## Agent

Manages messages, AI streaming, tool-call loops, and abort state.

```ts
import { Agent, type AgentTool } from 'share/lib/Agent'

const agent = new Agent({
  provider: 'openai',
  model: 'gpt-4o',
  systemPrompt: '...',
  maxIterations: 10,
  tools,
})

await agent.send('Hello')
agent.abort()
agent.isGenerating
agent.setProvider / setModel / setSystemPrompt / setMessages
```

## Shared Tools

```ts
import { WEB_FETCH_TOOL, WEB_SEARCH_TOOL } from 'share/tools/web'
import { EXEC_TOOL } from 'share/tools/shell'
import {
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
} from 'share/tools/fileSystem'
```

## Utilities

```ts
import {
  isDiskNodeDirectory,
  mediaDurationFormat,
  formatTimeAgo,
  formatRelativeDate,
  openImageFile,
  fileExists,
  resolveSavePath,
  getFileIcon,
  getMimeTypeFromPath,
  getFileCategory,
} from 'share/lib/util'
```

### EXIF

```ts
import { extractJpegExif, injectJpegExif } from 'share/lib/exif'

const exifSegment = extractJpegExif(originalBuffer)
if (exifSegment) {
  outputBuffer = injectJpegExif(compressedBuffer, exifSegment)
}
```

### Popup Window

```ts
import { openPopupWindow } from 'share/lib/popupWindow'

openPopupWindow(
  { width: 400, height: 350, alwaysOnTop: true },
  (popup, onClose) => <MyComponent onClose={onClose} />
)
```

Options: `width`, `height`, `minWidth?`, `minHeight?`, `alwaysOnTop?`, `resizable?`, `webviewTag?`.

### Holidays

Built-in international and Chinese holidays for calendar-style plugins. Requires `calendar.js` vendor (`js-calendar-converter`). Translations register automatically in the `holidays` i18n namespace when this module is imported.

```ts
import {
  getHolidaysForYearRange,
  getHolidayTemplates,
  getHolidayDateForYear,
  HOLIDAYS_NS,
} from 'share/lib/holidays'

const holidays = getHolidaysForYearRange(2026, 2027, 'zh-CN')
const label = t(holiday.nameKey, { ns: HOLIDAYS_NS })
```

## Git Preload (`share/preload/git.ts`)

Exposed via preload `contextBridge` as `git`:

- `searchCommits(ref, query, skip?, limit?, author?)`
- `getAuthors(ref)` / `getCheckoutInfo()` / `getWorkingTreeStatus()`
- `getWorkingTreeFileDiffContent(path, group, status, renameFrom?)`
- `stageFile(path)` / `unstageFile(path)` / `discardFile(path, group)`
- `stageFiles(paths)` / `unstageAllFiles()` / `discardFiles(paths, group)`
- `commitStaged(message)`
