import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import Grid from 'share/components/Grid'
import {
  ColDef,
  RowClickedEvent,
  GetRowIdParams,
  RowClassParams,
} from 'ag-grid-community'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'

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

  // Refresh row styles when selected entry changes
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [store.selectedEntryId])

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('noRowsToShow'),
    }),
    [t]
  )

  if (!store.selectedGroupId) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.text.secondary}`}
      >
        {t('noEntries')}
      </div>
    )
  }

  return (
    <Grid<RowData>
      isDark={store.isDark}
      ref={gridRef}
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
      localeText={localeText}
    />
  )
})
