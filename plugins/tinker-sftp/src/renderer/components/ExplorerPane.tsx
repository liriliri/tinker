import { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import FileList, {
  type IFileListEntry,
  type FileListSortMethod,
  type FileListSortOrder,
} from 'share/components/FileList'
import type Explorer from '../store/Explorer'
import ExplorerToolbar from './ExplorerToolbar'
import FileEntryIcon from './FileEntryIcon'
import TransferPanel from './TransferPanel'
import store from '../store'
import { showEntryContextMenu, showBlankContextMenu } from '../lib/contextMenu'
import { buildEntryContextMenuHandlers } from '../lib/explorerActions'

interface ExplorerPaneProps {
  tab: Explorer
}

export default observer(function ExplorerPane({ tab }: ExplorerPaneProps) {
  const { t } = useTranslation()

  const renderIcon = useCallback(
    (
      entry: Pick<IFileListEntry, 'isDirectory'>,
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
      showEntryContextMenu(
        event,
        tab,
        path,
        t,
        buildEntryContextMenuHandlers(tab.id, t)
      )
    },
    [tab, t]
  )

  const onBlankContextMenu = useCallback(
    (event: MouseEvent) => {
      showBlankContextMenu(event, tab, t, {
        onCreateFolder: (name) => store.createDirectory(tab.id, name),
      })
    },
    [tab, t]
  )

  if (tab.connecting) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm ${tw.text.tertiary}`}
      >
        {t('connecting')}
      </div>
    )
  }

  if (!tab.connected) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full gap-2 text-sm px-4 text-center ${tw.text.tertiary}`}
      >
        <p>{tab.connectionError ? tab.connectionError : t('disconnected')}</p>
      </div>
    )
  }

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
        {store.transferPanelOpen && <TransferPanel />}
      </div>
    </div>
  )
})
