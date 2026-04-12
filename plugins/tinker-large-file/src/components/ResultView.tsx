import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback, memo } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import fileSize from 'licia/fileSize'
import Grid from 'share/components/Grid'
import Checkbox from 'share/components/Checkbox'
import type { FileEntry } from '../types'
import store from '../store'

const ROW_HEIGHT = 36

const CheckboxCell = observer(function CheckboxCell({
  data,
}: ICellRendererParams<FileEntry>) {
  if (!data) return null
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: ROW_HEIGHT }}
    >
      <Checkbox
        checked={store.isSelected(data.path)}
        onChange={() => store.toggleFile(data.path)}
      />
    </div>
  )
})

const PathCell = memo(function PathCell({
  data,
}: ICellRendererParams<FileEntry>) {
  if (!data) return null
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    tinker.showItemInPath(data.path)
  }
  return (
    <span
      className="cursor-pointer hover:underline"
      onClick={handleClick}
      title={data.path}
    >
      {data.path}
    </span>
  )
})

export default observer(function ResultView() {
  const { t } = useTranslation()

  const columnDefs: ColDef<FileEntry>[] = useMemo(
    () => [
      {
        headerName: '',
        width: 50,
        sortable: false,
        cellRenderer: CheckboxCell,
        suppressMovable: true,
      },
      {
        field: 'name',
        headerName: t('fileName'),
        flex: 2,
        minWidth: 150,
        sortable: false,
      },
      {
        field: 'path',
        headerName: t('filePath'),
        flex: 3,
        minWidth: 200,
        sortable: false,
        cellRenderer: PathCell,
      },
      {
        field: 'size',
        headerName: t('fileSize'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'right' },
        valueFormatter: (params) =>
          params.value != null ? fileSize(params.value) : '',
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: { data: FileEntry }) => params.data.path,
    []
  )

  return (
    <div className="flex-1 overflow-hidden">
      <Grid<FileEntry>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={store.filteredFiles}
        getRowId={getRowId}
        headerHeight={ROW_HEIGHT}
        rowHeight={ROW_HEIGHT}
        enableCellTextSelection={true}
        suppressCellFocus={true}
        overlayNoRowsTemplate={`<span>${t('noRows')}</span>`}
      />
    </div>
  )
})
