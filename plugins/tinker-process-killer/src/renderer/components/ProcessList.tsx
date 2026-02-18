import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store, { ProcessInfo } from '../store'
import { AgGridReact } from 'ag-grid-react'
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  themeAlpine,
  GetRowIdParams,
  RowClickedEvent,
  ICellRendererParams,
} from 'ag-grid-community'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import fileSize from 'licia/fileSize'

ModuleRegistry.registerModules([AllCommunityModule])

const ProcessNameCell = observer(
  ({ data }: ICellRendererParams<ProcessInfo>) => {
    useEffect(() => {
      if (data && (data.path || data.command) && !data.icon) {
        store.loadProcessIcon(data.pid)
      }
    }, [data])

    if (!data) return null

    return (
      <div className="flex items-center gap-2">
        {data.icon ? (
          <img
            src={data.icon}
            alt=""
            className="w-4 h-4 flex-shrink-0"
            style={{ imageRendering: 'auto' }}
          />
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}
        <span className="truncate">{data.name}</span>
      </div>
    )
  }
)

export default observer(function ProcessList() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<ProcessInfo>>(null)

  const columnDefs: ColDef<ProcessInfo>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('processName'),
        flex: 2,
        minWidth: 150,
        sortable: true,
        cellClass: 'font-medium',
        cellRenderer: ProcessNameCell,
      },
      {
        field: 'pid',
        headerName: t('pid'),
        flex: 1,
        minWidth: 80,
        sortable: true,
        cellClass: 'font-mono text-sm',
      },
      {
        field: 'cpu',
        headerName: t('cpu'),
        flex: 1,
        minWidth: 80,
        sortable: true,
        valueFormatter: (params) => `${params.value.toFixed(1)}%`,
        cellClass: 'text-sm',
        hide: store.viewMode !== 'cpu',
      },
      {
        field: 'memRss',
        headerName: t('memory'),
        flex: 1,
        minWidth: 100,
        sortable: true,
        valueFormatter: (params) => `${fileSize(params.value * 1024)}B`,
        cellClass: 'text-sm',
        hide: store.viewMode !== 'memory',
      },
      {
        field: 'ports',
        headerName: t('port'),
        flex: 2,
        minWidth: 150,
        sortable: true,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          return params.value
            .split(', ')
            .map((port: string) => port.split(':')[1] || port)
            .join(' ')
        },
        tooltipValueGetter: (params) => params.value || undefined,
        cellClass: 'text-sm font-mono',
        hide: store.viewMode !== 'port',
      },
      {
        field: 'user',
        headerName: t('user'),
        flex: 1,
        minWidth: 100,
        sortable: false,
        valueFormatter: (params) => params.value || '-',
        cellClass: 'text-sm',
      },
      {
        field: 'path',
        headerName: t('path'),
        flex: 3,
        minWidth: 200,
        sortable: false,
        valueFormatter: (params) => params.value || '-',
        cellClass: 'text-sm',
        tooltipField: 'path',
      },
    ],
    [t, store.viewMode]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<ProcessInfo>) => params.data.pid.toString(),
    []
  )

  const onRowClicked = useCallback((event: RowClickedEvent<ProcessInfo>) => {
    if (event.data) {
      store.killProcess(event.data.pid, event.data.name)
    }
  }, [])

  const theme = useMemo(() => {
    return themeAlpine.withParams({
      accentColor: '#0fc25e',
      backgroundColor: store.isDark ? '#1e1e1e' : '#ffffff',
      foregroundColor: store.isDark ? '#d4d4d4' : '#000000',
      browserColorScheme: store.isDark ? 'dark' : 'light',
      borderWidth: 1,
      borderColor: store.isDark ? '#3f3f46' : '#e5e7eb',
      borderRadius: 0,
      headerBackgroundColor: store.isDark ? '#27272a' : '#f9fafb',
      headerTextColor: store.isDark ? '#d4d4d4' : '#000000',
      oddRowBackgroundColor: store.isDark ? '#1e1e1e' : '#ffffff',
      rowHoverColor: store.isDark ? '#27272a' : '#f3f4f6',
      selectedRowBackgroundColor: store.isDark ? '#27272a' : '#f3f4f6',
    })
  }, [store.isDark])

  const localeText = useMemo(
    () => ({
      noRowsToShow: store.searchKeyword ? t('noProcesses') : '',
    }),
    [t, store.searchKeyword]
  )

  const onSortChanged = useCallback(() => {
    const columnState = gridRef.current?.api.getColumnState()
    const sortedColumn = columnState?.find((col) => col.sort !== null)

    if (sortedColumn) {
      const field = sortedColumn.colId as
        | 'pid'
        | 'name'
        | 'cpu'
        | 'memRss'
        | 'ports'
      if (['pid', 'name', 'cpu', 'memRss', 'ports'].includes(field)) {
        store.sortField = field
        store.sortOrder = sortedColumn.sort === 'asc' ? 'asc' : 'desc'
      }
    }
  }, [])

  useEffect(() => {
    if (gridRef.current?.api) {
      const columnState = gridRef.current.api.getColumnState()
      const updatedState = columnState.map((col) => {
        if (col.colId === store.sortField) {
          return { ...col, sort: store.sortOrder }
        }
        return { ...col, sort: null }
      })
      gridRef.current.api.applyColumnState({ state: updatedState })
    }
  }, [store.sortField, store.sortOrder])

  if (store.isLoading && store.processes.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full ${tw.text.secondary}`}
      >
        {t('loading')}
      </div>
    )
  }

  return (
    <div className="h-full">
      <AgGridReact<ProcessInfo>
        ref={gridRef}
        theme={theme}
        columnDefs={columnDefs}
        rowData={store.filteredProcesses}
        getRowId={getRowId}
        onRowClicked={onRowClicked}
        headerHeight={40}
        rowHeight={40}
        animateRows={false}
        enableCellTextSelection={true}
        suppressCellFocus={true}
        localeText={localeText}
        onSortChanged={onSortChanged}
        tooltipShowDelay={500}
      />
    </div>
  )
})
