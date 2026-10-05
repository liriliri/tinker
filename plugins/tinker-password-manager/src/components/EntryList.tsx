import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import Grid from 'share/components/Grid'
import {
  ColDef,
  SelectionChangedEvent,
  GetRowIdParams,
} from 'ag-grid-community'
import map from 'licia/map'
import { useMemo, useCallback } from 'react'

interface RowData {
  id: string
  title: string
  username: string
  url: string
}

export default observer(function EntryList() {
  const { t } = useTranslation()

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

  const rowData = useMemo(
    () =>
      map(store.filteredEntries, (entry) => ({
        id: entry.uuid,
        title: entry.title,
        username: entry.username,
        url: entry.url,
      })),
    [store.filteredEntries]
  )

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<RowData>) => {
      const rows = event.api.getSelectedRows()
      if (rows[0]) {
        store.selectEntry(rows[0].id)
      }
    },
    []
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('noRowsToShow'),
    }),
    [t]
  )

  const rowSelection = useMemo(
    () => ({
      mode: 'singleRow' as const,
      checkboxes: false,
      enableClickSelection: true,
    }),
    []
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
      columnDefs={columnDefs}
      rowData={rowData}
      rowSelection={rowSelection}
      onSelectionChanged={onSelectionChanged}
      getRowId={getRowId}
      animateRows={true}
      enableCellTextSelection={false}
      suppressCellFocus={true}
      localeText={localeText}
    />
  )
})
