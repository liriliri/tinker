import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import FilePreview from 'share/components/FilePreview'
import FileList, {
  type IFileListEntry,
  type FileListSortMethod,
  type FileListSortOrder,
} from 'share/components/FileList'
import type Explorer from '../store/Explorer'
import ExplorerToolbar from './ExplorerToolbar'
import FileEntryIcon from './FileEntryIcon'
import store from '../store'
import { showEntryContextMenu, showBlankContextMenu } from '../lib/contextMenu'

interface ExplorerPaneProps {
  tab: Explorer
}

export default observer(function ExplorerPane({ tab }: ExplorerPaneProps) {
  const { t } = useTranslation()

  const renderIcon = useCallback(
    (
      entry: Pick<IFileListEntry, 'path' | 'isDirectory'>,
      size?: number,
      className?: string
    ) => (
      <FileEntryIcon
        path={entry.path}
        isDirectory={entry.isDirectory}
        size={size}
        className={className}
      />
    ),
    []
  )

  const onSelect = useCallback(
    (
      index: number,
      path: string,
      modifiers: { shift: boolean; ctrlOrMeta: boolean }
    ) => {
      tab.handleRowSelect(index, path, modifiers)
    },
    [tab]
  )

  const onActivate = useCallback(
    (entry: Pick<IFileListEntry, 'path' | 'isDirectory'>) => {
      void store.activateEntry(tab.id, entry.path, entry.isDirectory)
    },
    [tab.id]
  )

  const onSort = useCallback(
    (method: FileListSortMethod, order: FileListSortOrder) => {
      tab.setSort(method, order)
    },
    [tab]
  )

  const onEntryContextMenu = useCallback(
    (event: MouseEvent, path: string) => {
      showEntryContextMenu(event, tab, path, t, {
        onCopy: () => store.copySelection(tab.id),
        onCut: () => store.cutSelection(tab.id),
        onOpenInTerminal: (entryPath, isDir) =>
          store.openInIntegratedTerminal(entryPath, isDir),
        onTrash: (paths) => {
          void store.trashPaths(tab.id, paths)
        },
        onRename: (entryPath, newName) =>
          store.renameEntry(tab.id, entryPath, newName),
      })
    },
    [tab, t]
  )

  const onBlankContextMenu = useCallback(
    (event: MouseEvent) => {
      showBlankContextMenu(event, tab, t, {
        canPaste: store.hasClipboard && store.canPasteTo(tab.path),
        onPaste: () => {
          void store.pasteClipboard(tab.id)
        },
        onOpenInTerminal: () => store.openInIntegratedTerminal(tab.path, true),
        onCreateFolder: (name) => store.createFolder(tab.id, name),
      })
    },
    [tab, t]
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <ExplorerToolbar tab={tab} />
      <div className="flex-1 min-h-0 overflow-hidden flex">
        <div className="flex-1 min-h-0 overflow-hidden">
          <FileList
            viewMode={store.viewMode}
            isDark={store.isDark}
            entries={tab.visibleEntries}
            selectedPaths={tab.selectedPaths}
            sortMethod={tab.sortMethod}
            sortOrder={tab.sortOrder}
            loading={tab.loading}
            error={tab.error}
            isFiltering={tab.isFiltering}
            currentPath={tab.path}
            selectAllActive={store.activeTabId === tab.id}
            onSelectAll={() => tab.selectAll()}
            renderIcon={renderIcon}
            onSelect={onSelect}
            onActivate={onActivate}
            onSort={onSort}
            onEntryContextMenu={onEntryContextMenu}
            onBlankContextMenu={onBlankContextMenu}
          />
        </div>
        {store.showPreview && <FilePreview path={tab.previewPath} />}
      </div>
    </div>
  )
})
