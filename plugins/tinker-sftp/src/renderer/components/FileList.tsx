import { useEffect, useMemo, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  RowClickedEvent,
  RowDoubleClickedEvent,
  RowClassParams,
  CellContextMenuEvent,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import fileSize from 'licia/fileSize'
import dateFormat from 'licia/dateFormat'
import { tw } from 'share/theme'
import Grid from 'share/components/Grid'
import type { IFileEntry, SortMethod } from '../../common/types'
import type Explorer from '../store/Explorer'
import store from '../store'
import FileEntryIcon from './FileEntryIcon'
import { showEntryContextMenu, showBlankContextMenu } from '../lib/contextMenu'
import { buildEntryContextMenuHandlers } from '../lib/explorerActions'
import { useSelectAll } from '../hooks/useSelectAll'

interface FileListProps {
  tab: Explorer
}

const SORT_FIELD_MAP: Record<string, SortMethod> = {
  name: 'name',
  size: 'size',
  mtimeMs: 'mtime',
}

const SORT_METHOD_FIELD: Record<SortMethod, string> = {
  name: 'name',
  size: 'size',
  mtime: 'mtimeMs',
}

const keepRowOrder = () => 0

const NameCell = observer(function NameCell({
  data,
}: ICellRendererParams<IFileEntry>) {
  if (!data) return null

  return (
    <div className="flex items-center gap-2 min-w-0">
      <FileEntryIcon isDirectory={data.isDirectory} />
      <span className="truncate">{data.name}</span>
    </div>
  )
})

export default observer(function FileList({ tab }: FileListProps) {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<IFileEntry>>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const columnDefs: ColDef<IFileEntry>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('colName'),
        flex: 2,
        minWidth: 180,
        sortable: true,
        comparator: keepRowOrder,
        cellRenderer: NameCell,
      },
      {
        field: 'size',
        headerName: t('colSize'),
        width: 110,
        minWidth: 90,
        sortable: true,
        comparator: keepRowOrder,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (params) => {
          if (!params.data?.isDirectory && params.value != null) {
            return fileSize(params.value)
          }
          return '--'
        },
      },
      {
        field: 'mtimeMs',
        headerName: t('colModified'),
        width: 180,
        minWidth: 160,
        sortable: true,
        comparator: keepRowOrder,
        cellClass: 'font-mono tabular-nums',
        cellStyle: { textAlign: 'right' },
        valueFormatter: (params) =>
          params.value
            ? dateFormat(new Date(params.value), 'yyyy-mm-dd HH:MM')
            : '--',
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<IFileEntry>) => params.data.path,
    []
  )

  const onSortChanged = useCallback(() => {
    const columnState = gridRef.current?.api.getColumnState()
    const sortedColumn = columnState?.find((col) => col.sort != null)

    if (sortedColumn) {
      const method = SORT_FIELD_MAP[sortedColumn.colId]
      if (method) {
        tab.setSort(method, sortedColumn.sort === 'asc' ? 'asc' : 'desc')
      }
      return
    }

    tab.setSort('name', 'asc')
  }, [tab])

  const onRowClicked = useCallback(
    (event: RowClickedEvent<IFileEntry>) => {
      if (!event.data) return

      const mouseEvent = event.event as MouseEvent | undefined
      const index = tab.visibleEntries.findIndex(
        (entry) => entry.path === event.data!.path
      )
      if (index < 0) return

      tab.handleRowSelect(index, event.data.path, {
        shift: mouseEvent?.shiftKey ?? false,
        ctrlOrMeta: mouseEvent?.metaKey || mouseEvent?.ctrlKey || false,
      })
    },
    [tab]
  )

  const onRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<IFileEntry>) => {
      if (!event.data) return
      void store.activateEntry(tab.id, event.data.path, event.data.isDirectory)
    },
    [tab.id]
  )

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent<IFileEntry>) => {
      const mouseEvent = event.event as MouseEvent | undefined
      if (!mouseEvent || !event.data) return

      showEntryContextMenu(
        mouseEvent,
        tab,
        event.data.path,
        t,
        buildEntryContextMenuHandlers(tab.id, t)
      )
    },
    [tab, t]
  )

  const onContainerContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.ag-row') || target.closest('.ag-header')) return

      showBlankContextMenu(event.nativeEvent, tab, t, {
        onCreateFolder: (name) => store.createDirectory(tab.id, name),
      })
    },
    [tab, t]
  )

  const getRowClass = useCallback(
    (params: RowClassParams<IFileEntry>) => {
      if (params.data && tab.selectedPaths.includes(params.data.path)) {
        return 'ag-row-selected'
      }
      return ''
    },
    [tab.selectedPaths]
  )

  useEffect(() => {
    gridRef.current?.api?.redrawRows()
  }, [tab.selectedPaths])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return

    const columnState = api.getColumnState()
    const sortField = SORT_METHOD_FIELD[tab.sortMethod]
    const updatedState = columnState.map((col) => ({
      ...col,
      sort: col.colId === sortField ? tab.sortOrder : null,
    }))
    api.applyColumnState({ state: updatedState })
  }, [tab.sortMethod, tab.sortOrder])

  useEffect(() => {
    if (tab.loading) return

    requestAnimationFrame(() => {
      const api = gridRef.current?.api
      if (!api) return

      if (api.getDisplayedRowCount() > 0) {
        api.ensureIndexVisible(0, 'top')
        return
      }

      const viewport = containerRef.current?.querySelector('.ag-body-viewport')
      if (viewport instanceof HTMLElement) {
        viewport.scrollTop = 0
      }
    })
  }, [tab.path, tab.loading])

  useSelectAll(tab, store.activeTabId === tab.id)

  const emptyMessage = tab.isFiltering ? t('noFilterResults') : t('emptyFolder')

  const localeText = useMemo(
    () => ({
      noRowsToShow: emptyMessage,
    }),
    [emptyMessage]
  )

  if (tab.error) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm px-4 text-center ${tw.text.tertiary}`}
      >
        {tab.error}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full"
      onContextMenu={onContainerContextMenu}
    >
      <Grid<IFileEntry>
        ref={gridRef}
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={tab.visibleEntries}
        getRowId={getRowId}
        loading={tab.loading}
        onRowClicked={onRowClicked}
        onRowDoubleClicked={onRowDoubleClicked}
        onCellContextMenu={onCellContextMenu}
        onSortChanged={onSortChanged}
        preventDefaultOnContextMenu={true}
        getRowClass={getRowClass}
        animateRows={false}
        enableCellTextSelection={false}
        suppressCellFocus={true}
        localeText={localeText}
        overlayNoRowsTemplate={`<span>${emptyMessage}</span>`}
      />
    </div>
  )
})
