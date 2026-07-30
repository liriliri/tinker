import { observer } from 'mobx-react-lite'
import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import contain from 'licia/contain'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import some from 'licia/some'
import trim from 'licia/trim'
import Grid from 'share/components/Grid'
import {
  ColDef,
  SelectionChangedEvent,
  GetRowIdParams,
  ICellRendererParams,
  RowDragEndEvent,
  IRowDragItem,
} from 'ag-grid-community'
import store from '../store'
import AddProviderDialog from './AddProviderDialog'
import ClaudeIcon from '../assets/claude.svg?react'
import OpenAIIcon from '../assets/openai.svg?react'

interface RowData {
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

interface AiSectionProps {
  search: string
  addOpen: boolean
  onAddClose: () => void
}

export default observer(function AiSection({
  search,
  addOpen,
  onAddClose,
}: AiSectionProps) {
  const { t } = useTranslation()

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('providerName'),
        flex: 1,
        minWidth: 120,
        cellRenderer: ProviderNameCell,
      },
      {
        field: 'defaultModel',
        headerName: t('defaultModel'),
        flex: 1,
        minWidth: 80,
      },
      {
        field: 'apiUrl',
        headerName: t('apiUrl'),
        flex: 2,
        minWidth: 150,
      },
    ],
    [t]
  )

  const keyword = lowerCase(trim(search))
  const rowData: RowData[] = map(
    filter(
      store.aiProviders,
      (p) =>
        isEmpty(keyword) ||
        contain(lowerCase(p.name), keyword) ||
        some(p.models, (m) => contain(lowerCase(m.name), keyword)) ||
        contain(lowerCase(p.apiUrl), keyword)
    ),
    (p) => ({
      name: p.name,
      defaultModel: p.models[0]?.name ?? '',
      apiUrl: p.apiUrl,
      apiType: p.apiType,
    })
  )

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<RowData>) => {
      const rows = event.api.getSelectedRows()
      if (rows[0]) store.setSelectedProviderName(rows[0].name)
    },
    []
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.name,
    []
  )

  const onRowDragEnd = useCallback((event: RowDragEndEvent<RowData>) => {
    const { node, overNode } = event
    if (!overNode || node.id === overNode.id) return
    const fromName = node.data?.name
    const toName = overNode.data?.name
    if (!fromName || !toName) return
    const fromIndex = findIdx(store.aiProviders, (p) => p.name === fromName)
    const toIndex = findIdx(store.aiProviders, (p) => p.name === toName)
    if (fromIndex !== -1 && toIndex !== -1) {
      store.reorderAiProviders(fromIndex, toIndex)
    }
  }, [])

  const localeText = useMemo(() => ({ noRowsToShow: t('noProviders') }), [t])

  return (
    <div className="h-full overflow-hidden">
      <Grid<RowData>
        isDark={store.isDark}
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={{ sortable: false }}
        rowSelection={{
          mode: 'singleRow',
          checkboxes: false,
          enableClickSelection: true,
        }}
        onSelectionChanged={onSelectionChanged}
        getRowId={getRowId}
        animateRows={false}
        enableCellTextSelection={false}
        suppressCellFocus={true}
        rowDragEntireRow={true}
        rowDragText={(params: IRowDragItem) => params.rowNode?.data?.name ?? ''}
        onRowDragEnd={onRowDragEnd}
        localeText={localeText}
      />

      <AddProviderDialog open={addOpen} onClose={onAddClose} />
    </div>
  )
})
