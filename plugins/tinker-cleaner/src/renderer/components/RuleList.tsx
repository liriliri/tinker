import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useMemo, useCallback } from 'react'
import type { CellStyle, ColDef, ICellRendererParams } from 'ag-grid-community'
import fileSize from 'licia/fileSize'
import Grid from 'share/components/Grid'
import Checkbox from 'share/components/Checkbox'
import type { CleanRule } from '../types'
import store from '../store'

const ROW_HEIGHT = 36

const CheckboxCell = observer(function CheckboxCell({
  data,
}: ICellRendererParams<CleanRule>) {
  if (!data) return null
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: ROW_HEIGHT }}
    >
      <Checkbox
        checked={store.selectedRules.has(data.id)}
        onChange={() => store.toggleRule(data.id)}
      />
    </div>
  )
})

export default observer(function RuleList() {
  const { t } = useTranslation()

  const columnDefs: ColDef<CleanRule>[] = useMemo(
    () => [
      {
        headerName: '',
        width: 50,
        sortable: false,
        cellRenderer: CheckboxCell,
        suppressMovable: true,
        cellStyle: { paddingRight: 0 } as CellStyle,
      },
      {
        headerName: t('ruleName'),
        flex: 2,
        minWidth: 120,
        sortable: false,
        valueGetter: (params) => (params.data ? t(params.data.nameKey) : ''),
      },
      {
        field: 'path',
        headerName: t('rulePath'),
        flex: 3,
        minWidth: 200,
        sortable: false,
      },
      {
        field: 'size',
        headerName: t('ruleSize'),
        width: 120,
        sortable: false,
        cellStyle: { textAlign: 'right' } as CellStyle,
        valueFormatter: (params) => {
          if (!params.data?.scanned) return '—'
          return params.value != null ? fileSize(params.value) : '0'
        },
      },
    ],
    [t]
  )

  const getRowId = useCallback(
    (params: { data: CleanRule }) => params.data.id,
    []
  )

  return (
    <div className="flex-1 overflow-hidden">
      <Grid<CleanRule>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={store.filteredRules}
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
