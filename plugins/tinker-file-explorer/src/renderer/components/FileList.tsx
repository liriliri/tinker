import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import type {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  RowClickedEvent,
  RowDoubleClickedEvent,
  RowClassParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import fileSize from 'licia/fileSize'
import dateFormat from 'licia/dateFormat'
import { Folder } from 'lucide-react'
import { tw } from 'share/theme'
import Grid from 'share/components/Grid'
import { getFileIcon } from 'share/lib/util'
import type { IFileEntry } from '../../common/types'
import type ExplorerTab from '../store/ExplorerTab'
import store from '../store'

interface FileListProps {
  tab: ExplorerTab
}

const NameCell = observer(function NameCell({
  data,
}: ICellRendererParams<IFileEntry>) {
  const [icon, setIcon] = useState<string | undefined>()

  useEffect(() => {
    if (!data || data.isDirectory) {
      setIcon(undefined)
      return
    }

    let active = true
    getFileIcon(data.path).then((result) => {
      if (active) setIcon(result)
    })
    return () => {
      active = false
    }
  }, [data?.path, data?.isDirectory])

  if (!data) return null

  return (
    <div className="flex items-center gap-2 min-w-0">
      {data.isDirectory ? (
        <Folder size={16} className={`shrink-0 ${tw.primary.text}`} />
      ) : icon ? (
        <img src={icon} alt="" className="w-4 h-4 shrink-0 object-contain" />
      ) : (
        <span className="w-4 h-4 shrink-0" />
      )}
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
        sortable: false,
        cellRenderer: NameCell,
      },
      {
        field: 'size',
        headerName: t('colSize'),
        width: 110,
        minWidth: 90,
        sortable: false,
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
        width: 160,
        minWidth: 140,
        sortable: false,
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

  const onRowClicked = useCallback(
    (event: RowClickedEvent<IFileEntry>) => {
      if (!event.data) return

      const mouseEvent = event.event as MouseEvent | undefined
      const index = tab.sortedEntries.findIndex(
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

  useEffect(() => {
    if (store.activeTabId !== tab.id) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        tab.selectAll()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tab, store.activeTabId])

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('emptyFolder'),
    }),
    [t]
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
    <div ref={containerRef} className="h-full">
      <Grid<IFileEntry>
        ref={gridRef}
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={tab.sortedEntries}
        getRowId={getRowId}
        loading={tab.loading}
        onRowClicked={onRowClicked}
        onRowDoubleClicked={onRowDoubleClicked}
        getRowClass={getRowClass}
        animateRows={false}
        enableCellTextSelection={false}
        suppressCellFocus={true}
        localeText={localeText}
        overlayNoRowsTemplate={`<span>${t('emptyFolder')}</span>`}
      />
    </div>
  )
})
