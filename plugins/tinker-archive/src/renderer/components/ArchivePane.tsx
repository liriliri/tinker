import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import FileList, {
  type IFileListEntry,
  type FileListSortMethod,
  type FileListSortOrder,
} from 'share/components/FileList'
import { confirm } from 'share/components/Confirm'
import map from 'licia/map'
import compact from 'licia/compact'
import isEmpty from 'licia/isEmpty'
import toArr from 'licia/toArr'
import store from '../store'
import FileEntryIcon from './FileEntryIcon'
import { showBlankContextMenu, showEntryContextMenu } from '../lib/contextMenu'

export default observer(function ArchivePane() {
  const { t } = useTranslation()

  const renderIcon = useCallback(
    (
      entry: Pick<IFileListEntry, 'path' | 'isDirectory'>,
      size?: number,
      className?: string
    ) => (
      <FileEntryIcon
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
      store.handleRowSelect(index, path, modifiers)
    },
    []
  )

  const onActivate = useCallback(
    (entry: Pick<IFileListEntry, 'path' | 'isDirectory'>) => {
      void store.activateEntry(entry.path, entry.isDirectory)
    },
    []
  )

  const onSort = useCallback(
    (method: FileListSortMethod, order: FileListSortOrder) => {
      store.setSort(method, order)
    },
    []
  )

  const onEntryContextMenu = useCallback(
    (event: MouseEvent, path: string) => {
      showEntryContextMenu(event, store, path, t, {
        onExtract: () => {
          void store.extractSelection()
        },
        onDelete: () => {
          void (async () => {
            const ok = await confirm({
              title: t('deleteConfirmTitle'),
              message: t('deleteConfirmMessage', {
                count: store.selectedCount,
              }),
            })
            if (!ok) return
            await store.deleteSelection()
          })()
        },
      })
    },
    [t]
  )

  const onBlankContextMenu = useCallback(
    (event: MouseEvent) => {
      showBlankContextMenu(event, store, t, {
        onAddFiles: () => {
          void store.addFiles()
        },
        onCreateFolder: (name) => store.createFolder(name),
        onExtractAll: () => {
          void store.extractAll()
        },
      })
    },
    [t]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const paths = compact(
      map(toArr(files), (file: File) => tinker.getPathForFile(file))
    )
    if (isEmpty(paths)) return
    await store.addFiles(paths)
  }

  return (
    <div
      className="flex-1 min-h-0 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <FileList
        viewMode={store.viewMode}
        isDark={store.isDark}
        entries={store.visibleEntries}
        selectedPaths={store.selectedPaths}
        sortMethod={store.sortMethod}
        sortOrder={store.sortOrder}
        loading={store.loading}
        error={store.error}
        isFiltering={store.isFiltering}
        currentPath={store.currentPath}
        selectAllActive
        onSelectAll={() => store.selectAll()}
        renderIcon={renderIcon}
        onSelect={onSelect}
        onActivate={onActivate}
        onSort={onSort}
        onEntryContextMenu={onEntryContextMenu}
        onBlankContextMenu={onBlankContextMenu}
      />
    </div>
  )
})
