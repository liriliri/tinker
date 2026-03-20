import { observer } from 'mobx-react-lite'
import { useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Grid from 'share/components/Grid'
import {
  ColDef,
  RowClickedEvent,
  GetRowIdParams,
  ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import store from '../store'
import AddProviderDialog from './AddProviderDialog'
import ClaudeIcon from '../assets/claude.svg?react'
import OpenAIIcon from '../assets/openai.svg?react'

interface RowData {
  id: string
  name: string
  defaultModel: string
  apiUrl: string
  apiType: string
}

const ProviderNameCell = ({ data }: ICellRendererParams<RowData>) => {
  if (!data) return null
  const Icon = data.apiType === 'claude' ? ClaudeIcon : OpenAIIcon
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{data.name}</span>
    </div>
  )
}

interface Props {
  search: string
  addOpen: boolean
  onAddClose: () => void
}

export default observer(function AiSection({
  search,
  addOpen,
  onAddClose,
}: Props) {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<RowData>>(null)

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('providerName'),
        flex: 1,
        minWidth: 120,
        sortable: true,
        cellRenderer: ProviderNameCell,
      },
      {
        field: 'defaultModel',
        headerName: t('defaultModel'),
        flex: 1,
        minWidth: 80,
        sortable: true,
      },
      {
        field: 'apiUrl',
        headerName: t('apiUrl'),
        flex: 2,
        minWidth: 150,
        sortable: true,
      },
    ],
    [t]
  )

  const keyword = search.trim().toLowerCase()
  const rowData: RowData[] = store.aiProviders
    .filter(
      (p) =>
        !keyword ||
        p.name.toLowerCase().includes(keyword) ||
        p.models.some((m) => m.name.toLowerCase().includes(keyword)) ||
        p.apiUrl.toLowerCase().includes(keyword)
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      defaultModel: p.models[0]?.name ?? '',
      apiUrl: p.apiUrl,
      apiType: p.apiType,
    }))

  const onRowClicked = useCallback((event: RowClickedEvent<RowData>) => {
    if (event.data) store.setSelectedProviderId(event.data.id)
  }, [])

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const getRowClass = (params: { data?: RowData }) =>
    params.data?.id === store.selectedProviderId ? 'ag-row-selected' : ''

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [store.selectedProviderId])

  const localeText = useMemo(() => ({ noRowsToShow: t('noProviders') }), [t])

  return (
    <div className="h-full overflow-hidden">
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

      <AddProviderDialog open={addOpen} onClose={onAddClose} />
    </div>
  )
})
