import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { tw } from 'share/theme'
import Grid from 'share/components/Grid'
import { AgGridReact } from 'ag-grid-react'
import {
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  RowClickedEvent,
  RowClassParams,
} from 'ag-grid-community'
import type { FileRow } from '../types'
import store from '../store'

const NewNameCell = observer(({ data }: ICellRendererParams<FileRow>) => {
  if (!data) return null

  return (
    <span
      className={data.changed ? `${tw.primary.text} font-medium` : ''}
      title={data.newName}
    >
      {data.newName}
    </span>
  )
})

export default observer(function FileList() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<FileRow>>(null)

  const columnDefs: ColDef<FileRow>[] = useMemo(
    () => [
      {
        headerName: t('index'),
        field: 'index',
        width: 60,
        minWidth: 60,
        maxWidth: 80,
        sortable: false,
        cellClass: `text-center ${tw.text.tertiary}`,
      },
      {
        headerName: t('original'),
        field: 'original',
        flex: 1,
        minWidth: 150,
        sortable: false,
        tooltipField: 'original',
      },
      {
        headerName: t('newName'),
        field: 'newName',
        flex: 1,
        minWidth: 150,
        sortable: false,
        cellRenderer: NewNameCell,
        tooltipField: 'newName',
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<FileRow>) => params.data.fullPath,
    []
  )

  const onRowClicked = useCallback((event: RowClickedEvent<FileRow>) => {
    if (event.data) {
      store.selectFile(event.data.fullPath)
    }
  }, [])

  const getRowClass = useCallback((params: RowClassParams<FileRow>) => {
    if (params.data && store.selectedFile === params.data.fullPath) {
      return 'ag-row-selected'
    }
    return ''
  }, [])

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [store.selectedFile])

  const localeText = useMemo(
    () => ({
      noRowsToShow: t('noFiles'),
    }),
    [t]
  )

  return (
    <Grid<FileRow>
      isDark={store.isDark}
      ref={gridRef}
      columnDefs={columnDefs}
      rowData={store.rowData}
      getRowId={getRowId}
      onRowClicked={onRowClicked}
      getRowClass={getRowClass}
      headerHeight={40}
      rowHeight={40}
      animateRows={false}
      enableCellTextSelection={true}
      suppressCellFocus={true}
      localeText={localeText}
      tooltipShowDelay={500}
    />
  )
})
