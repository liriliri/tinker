import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { AgGridReact } from 'ag-grid-react'
import {
  ColDef,
  ModuleRegistry,
  AllCommunityModule,
  themeAlpine,
  RowClickedEvent,
  GetRowIdParams,
  RowClassParams,
} from 'ag-grid-community'
import { useMemo, useCallback, useRef, useEffect } from 'react'

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule])

interface RowData {
  id: string
  title: string
  username: string
  url: string
}

export default observer(function EntryList() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<RowData>>(null)

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        field: 'title',
        headerName: t('title'),
        flex: 1,
        minWidth: 150,
        sortable: true,
      },
      {
        field: 'username',
        headerName: t('username'),
        flex: 1,
        minWidth: 120,
        sortable: true,
      },
      {
        field: 'url',
        headerName: t('url'),
        flex: 1,
        minWidth: 150,
        sortable: true,
      },
    ],
    [t]
  )

  const rowData = useMemo(() => {
    return store.filteredEntries.map((entry) => ({
      id: entry.uuid,
      title: entry.title,
      username: entry.username,
      url: entry.url,
    }))
  }, [store.filteredEntries])

  const onRowClicked = useCallback((event: RowClickedEvent<RowData>) => {
    if (event.data) {
      store.selectEntry(event.data.id)
    }
  }, [])

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const getRowClass = useCallback((params: RowClassParams<RowData>) => {
    if (params.data && params.data.id === store.selectedEntryId) {
      return 'ag-row-selected'
    }
    return ''
  }, [])

  // 当选中的 entry 变化时，刷新所有行的样式
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [store.selectedEntryId])

  // 使用 AG Grid 的主题 API，直接使用 store.isDark
  const theme = useMemo(() => {
    return themeAlpine.withParams({
      accentColor: '#0fc25e',
      backgroundColor: store.isDark ? '#1e1e1e' : '#ffffff',
      foregroundColor: store.isDark ? '#d4d4d4' : '#000000',
      browserColorScheme: store.isDark ? 'dark' : 'light',
      borderWidth: 0,
      borderRadius: 0,
      headerBackgroundColor: store.isDark ? '#303133' : '#f0f1f2',
      headerTextColor: store.isDark ? '#d4d4d4' : '#000000',
      oddRowBackgroundColor: store.isDark ? '#252526' : '#ffffff',
      rowHoverColor: store.isDark ? '#3a3a3c' : '#e5e5e5',
      selectedRowBackgroundColor: store.isDark ? '#0fc25e33' : '#0fc25e22',
    })
  }, [store.isDark])

  if (!store.selectedGroupId) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.text.both.secondary}`}
      >
        {t('noEntries')}
      </div>
    )
  }

  return (
    <div className="h-full">
      <AgGridReact<RowData>
        ref={gridRef}
        theme={theme}
        columnDefs={columnDefs}
        rowData={rowData}
        onRowClicked={onRowClicked}
        getRowId={getRowId}
        getRowClass={getRowClass}
        headerHeight={40}
        rowHeight={40}
        animateRows={true}
        enableCellTextSelection={false}
        suppressCellFocus={true}
      />
    </div>
  )
})
