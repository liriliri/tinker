import {
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
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
import { tw } from '../theme'
import Grid from './Grid'
import { LoadingCircle } from './Loading'
import { addI18nNamespace } from '../lib/i18n'

const I18N_NS = 'fileList'

addI18nNamespace(I18N_NS, {
  'en-US': {
    emptyFolder: 'This folder is empty',
    colName: 'Name',
    colSize: 'Size',
    colModified: 'Modified',
    noFilterResults: 'No matching files',
  },
  'zh-CN': {
    emptyFolder: '文件夹为空',
    colName: '名称',
    colSize: '大小',
    colModified: '修改时间',
    noFilterResults: '没有匹配的文件',
  },
})

export interface IFileListEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  mtimeMs: number
}

export type FileListViewMode = 'list' | 'grid'
export type FileListSortMethod = 'name' | 'size' | 'mtime'
export type FileListSortOrder = 'asc' | 'desc'

export interface FileListProps {
  viewMode: FileListViewMode
  isDark: boolean
  entries: IFileListEntry[]
  selectedPaths: string[]
  sortMethod: FileListSortMethod
  sortOrder: FileListSortOrder
  loading: boolean
  error: string | null
  isFiltering: boolean
  currentPath: string
  selectAllActive?: boolean
  onSelectAll?: () => void
  onSelect: (
    index: number,
    path: string,
    modifiers: { shift: boolean; ctrlOrMeta: boolean }
  ) => void
  onActivate: (entry: IFileListEntry) => void
  onSort: (method: FileListSortMethod, order: FileListSortOrder) => void
  onEntryContextMenu: (event: MouseEvent, path: string) => void
  onBlankContextMenu: (event: MouseEvent) => void
  renderIcon: (
    entry: IFileListEntry,
    size?: number,
    className?: string
  ) => ReactNode
}

const SORT_FIELD_MAP: Record<string, FileListSortMethod> = {
  name: 'name',
  size: 'size',
  mtimeMs: 'mtime',
}

const SORT_METHOD_FIELD: Record<FileListSortMethod, string> = {
  name: 'name',
  size: 'size',
  mtime: 'mtimeMs',
}

const GRID_ICON_SIZE = 48
const GRID_ITEM_SIZE = GRID_ICON_SIZE + 16
const GRID_GAP = 20

const keepRowOrder = () => 0

function createNameCell(
  renderIcon: FileListProps['renderIcon']
): (params: ICellRendererParams<IFileListEntry>) => ReactNode {
  return function NameCell({ data }: ICellRendererParams<IFileListEntry>) {
    if (!data) return null

    return (
      <div className="flex items-center gap-2 min-w-0">
        {renderIcon(data)}
        <span className="truncate">{data.name}</span>
      </div>
    )
  }
}

interface GridItemProps {
  entry: IFileListEntry
  index: number
  selected: boolean
  flexLayout: boolean
  renderIcon: FileListProps['renderIcon']
  onSelect: FileListProps['onSelect']
  onActivate: FileListProps['onActivate']
  onContextMenu: (event: React.MouseEvent, path: string) => void
}

function GridItem({
  entry,
  index,
  selected,
  flexLayout,
  renderIcon,
  onSelect,
  onActivate,
  onContextMenu,
}: GridItemProps) {
  return (
    <div
      title={entry.name}
      data-file-entry=""
      className={`flex flex-col items-center justify-center aspect-square w-16 box-border select-none ${
        flexLayout ? 'mr-5' : ''
      }`}
      onClick={(e) =>
        onSelect(index, entry.path, {
          shift: e.shiftKey,
          ctrlOrMeta: e.metaKey || e.ctrlKey,
        })
      }
      onDoubleClick={() => onActivate(entry)}
      onContextMenu={(e) => {
        e.stopPropagation()
        onContextMenu(e, entry.path)
      }}
    >
      <div
        className={`flex items-center justify-center w-16 h-16 p-2 mb-0.5 rounded overflow-hidden ${
          selected ? tw.bg.border : ''
        }`}
      >
        {renderIcon(entry, GRID_ICON_SIZE, 'h-full w-full object-contain')}
      </div>
      <div
        className={`w-[120%] text-center text-xs leading-[1.4] h-[2.8em] ${
          selected ? tw.primary.text : tw.text.primary
        }`}
      >
        <div className="line-clamp-2 break-words">{entry.name}</div>
      </div>
    </div>
  )
}

function FileListGridView({
  entries,
  selectedPaths,
  loading,
  isFiltering,
  currentPath,
  selectAllActive,
  onSelectAll,
  renderIcon,
  onSelect,
  onActivate,
  onEntryContextMenu,
  onBlankContextMenu,
}: FileListProps) {
  const { t } = useTranslation(I18N_NS)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<{
    flexLayout: boolean
    style: CSSProperties
  }>({
    flexLayout: false,
    style: { paddingLeft: GRID_GAP / 2, paddingRight: GRID_GAP / 2 },
  })

  const handleContextMenu = useCallback(
    (event: React.MouseEvent, clickedPath: string) => {
      onEntryContextMenu(event.nativeEvent, clickedPath)
    },
    [onEntryContextMenu]
  )

  const handleBlankContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('[data-file-entry]')) return
      onBlankContextMenu(event.nativeEvent)
    },
    [onBlankContextMenu]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateLayout = () => {
      const containerWidth = container.clientWidth
      const itemCount = entries.length
      const columnCount = Math.max(
        1,
        Math.floor(containerWidth / (GRID_ITEM_SIZE + GRID_GAP))
      )

      if (itemCount > columnCount) {
        const gap = Math.floor(
          (containerWidth - columnCount * GRID_ITEM_SIZE) / columnCount
        )
        setLayout({
          flexLayout: false,
          style: {
            display: 'grid',
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
            gap: `${GRID_GAP}px ${gap}px`,
            paddingLeft: gap / 2,
            paddingRight: gap / 2,
            paddingBottom: GRID_GAP,
          },
        })
        return
      }

      setLayout({
        flexLayout: true,
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          paddingLeft: GRID_GAP / 2,
          paddingRight: GRID_GAP / 2,
        },
      })
    }

    updateLayout()
    const observer = new ResizeObserver(updateLayout)
    observer.observe(container)
    return () => observer.disconnect()
  }, [entries.length])

  useEffect(() => {
    if (loading) return

    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
      }
    })
  }, [currentPath, loading])

  useEffect(() => {
    if (!selectAllActive || !onSelectAll) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        onSelectAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectAllActive, onSelectAll])

  const emptyMessage = isFiltering ? t('noFilterResults') : t('emptyFolder')

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden relative py-2"
      onContextMenu={handleBlankContextMenu}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingCircle />
        </div>
      )}
      {!loading && entries.length === 0 ? (
        <div
          className={`flex items-center justify-center h-full text-sm ${tw.text.tertiary}`}
        >
          {emptyMessage}
        </div>
      ) : (
        <div style={layout.style}>
          {entries.map((entry, index) => (
            <GridItem
              key={entry.path}
              entry={entry}
              index={index}
              selected={selectedPaths.includes(entry.path)}
              flexLayout={layout.flexLayout}
              renderIcon={renderIcon}
              onSelect={onSelect}
              onActivate={onActivate}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FileListTableView({
  isDark,
  entries,
  selectedPaths,
  sortMethod,
  sortOrder,
  loading,
  isFiltering,
  currentPath,
  selectAllActive,
  onSelectAll,
  renderIcon,
  onSelect,
  onActivate,
  onSort,
  onEntryContextMenu,
  onBlankContextMenu,
}: FileListProps) {
  const { t } = useTranslation(I18N_NS)
  const gridRef = useRef<AgGridReact<IFileListEntry>>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const columnDefs: ColDef<IFileListEntry>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('colName'),
        flex: 2,
        minWidth: 180,
        sortable: true,
        comparator: keepRowOrder,
        cellRenderer: createNameCell(renderIcon),
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
    [t, renderIcon]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<IFileListEntry>) => params.data.path,
    []
  )

  const onSortChanged = useCallback(() => {
    const columnState = gridRef.current?.api.getColumnState()
    const sortedColumn = columnState?.find((col) => col.sort != null)

    if (sortedColumn) {
      const method = SORT_FIELD_MAP[sortedColumn.colId]
      if (method) {
        onSort(method, sortedColumn.sort === 'asc' ? 'asc' : 'desc')
      }
      return
    }

    onSort('name', 'asc')
  }, [onSort])

  const onRowClicked = useCallback(
    (event: RowClickedEvent<IFileListEntry>) => {
      if (!event.data) return

      const mouseEvent = event.event as MouseEvent | undefined
      const index = entries.findIndex(
        (entry) => entry.path === event.data!.path
      )
      if (index < 0) return

      onSelect(index, event.data.path, {
        shift: mouseEvent?.shiftKey ?? false,
        ctrlOrMeta: mouseEvent?.metaKey || mouseEvent?.ctrlKey || false,
      })
    },
    [entries, onSelect]
  )

  const onRowDoubleClicked = useCallback(
    (event: RowDoubleClickedEvent<IFileListEntry>) => {
      if (!event.data) return
      onActivate(event.data)
    },
    [onActivate]
  )

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent<IFileListEntry>) => {
      const mouseEvent = event.event as MouseEvent | undefined
      if (!mouseEvent || !event.data) return
      onEntryContextMenu(mouseEvent, event.data.path)
    },
    [onEntryContextMenu]
  )

  const onContainerContextMenu = useCallback(
    (event: React.MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.ag-row') || target.closest('.ag-header')) return
      onBlankContextMenu(event.nativeEvent)
    },
    [onBlankContextMenu]
  )

  const getRowClass = useCallback(
    (params: RowClassParams<IFileListEntry>) => {
      if (params.data && selectedPaths.includes(params.data.path)) {
        return 'ag-row-selected'
      }
      return ''
    },
    [selectedPaths]
  )

  useEffect(() => {
    gridRef.current?.api?.redrawRows()
  }, [selectedPaths])

  useEffect(() => {
    const api = gridRef.current?.api
    if (!api) return

    const columnState = api.getColumnState()
    const sortField = SORT_METHOD_FIELD[sortMethod]
    const updatedState = columnState.map((col) => ({
      ...col,
      sort: col.colId === sortField ? sortOrder : null,
    }))
    api.applyColumnState({ state: updatedState })
  }, [sortMethod, sortOrder])

  useEffect(() => {
    if (loading) return

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
  }, [currentPath, loading])

  useEffect(() => {
    if (!selectAllActive || !onSelectAll) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        onSelectAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectAllActive, onSelectAll])

  const emptyMessage = isFiltering ? t('noFilterResults') : t('emptyFolder')

  const localeText = useMemo(
    () => ({
      noRowsToShow: emptyMessage,
    }),
    [emptyMessage]
  )

  return (
    <div
      ref={containerRef}
      className="h-full"
      onContextMenu={onContainerContextMenu}
    >
      <Grid<IFileListEntry>
        ref={gridRef}
        isDark={isDark}
        columnDefs={columnDefs}
        rowData={entries}
        getRowId={getRowId}
        loading={loading}
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
}

export default function FileList(props: FileListProps) {
  const { error } = props

  if (error) {
    return (
      <div
        className={`flex items-center justify-center h-full text-sm px-4 text-center ${tw.text.tertiary}`}
      >
        {error}
      </div>
    )
  }

  if (props.viewMode === 'grid') {
    return <FileListGridView {...props} />
  }

  return <FileListTableView {...props} />
}
