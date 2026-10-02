import { observer } from 'mobx-react-lite'
import { useMemo, useCallback, type ReactNode } from 'react'
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
import type { AiMode } from '../types'
import AddProviderDialog from './AddProviderDialog'
import ClaudeIcon from '../assets/claude.svg?react'
import NanoBananaIcon from '../assets/nano-banana.svg?react'
import OpenAIIcon from '../assets/openai.svg?react'
import SeedreamIcon from '../assets/seedream.svg?react'

interface RowData {
  name: string
  defaultModel: string
  apiUrl: string
  apiType: string
}

interface AiSectionProps {
  mode: AiMode
  search: string
  addOpen: boolean
  onAddClose: () => void
}

function ProviderNameCell({ data }: ICellRendererParams<RowData>) {
  if (!data) return null
  let icon: ReactNode
  if (data.apiType === 'claude') {
    icon = <ClaudeIcon className="w-4 h-4 flex-shrink-0" />
  } else if (data.apiType === 'gemini') {
    icon = <NanoBananaIcon className="w-4 h-4 flex-shrink-0" />
  } else if (data.apiType === 'seedream') {
    icon = <SeedreamIcon className="w-4 h-4 flex-shrink-0" />
  } else {
    icon = <OpenAIIcon className="w-4 h-4 flex-shrink-0" />
  }
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="truncate">{data.name}</span>
    </div>
  )
}

export default observer(function AiSection({
  mode,
  search,
  addOpen,
  onAddClose,
}: AiSectionProps) {
  const { t } = useTranslation()
  const isImage = mode === 'image'
  const keyword = lowerCase(trim(search))

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

  const matchesSearch = (p: {
    name: string
    apiUrl: string
    models: Array<{ name: string }>
  }) =>
    isEmpty(keyword) ||
    contain(lowerCase(p.name), keyword) ||
    some(p.models, (m) => contain(lowerCase(m.name), keyword)) ||
    contain(lowerCase(p.apiUrl), keyword)

  const toRow = (p: {
    name: string
    apiUrl: string
    apiType: string
    models: Array<{ name: string }>
  }): RowData => ({
    name: p.name,
    defaultModel: p.models[0]?.name ?? '',
    apiUrl: p.apiUrl,
    apiType: p.apiType,
  })

  const rowData: RowData[] = isImage
    ? map(filter(store.aiImageProviders, matchesSearch), toRow)
    : map(filter(store.aiProviders, matchesSearch), toRow)

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<RowData>) => {
      const rows = event.api.getSelectedRows()
      if (!rows[0]) return
      if (isImage) {
        store.setSelectedImageProviderName(rows[0].name)
      } else {
        store.setSelectedProviderName(rows[0].name)
      }
    },
    [isImage]
  )

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.name,
    []
  )

  const onRowDragEnd = useCallback(
    (event: RowDragEndEvent<RowData>) => {
      const { node, overNode } = event
      if (!overNode || node.id === overNode.id) return
      const fromName = node.data?.name
      const toName = overNode.data?.name
      if (!fromName || !toName) return
      if (isImage) {
        const fromIndex = findIdx(
          store.aiImageProviders,
          (p) => p.name === fromName
        )
        const toIndex = findIdx(
          store.aiImageProviders,
          (p) => p.name === toName
        )
        if (fromIndex !== -1 && toIndex !== -1) {
          void store.reorderAiImageProviders(fromIndex, toIndex)
        }
        return
      }
      const fromIndex = findIdx(store.aiProviders, (p) => p.name === fromName)
      const toIndex = findIdx(store.aiProviders, (p) => p.name === toName)
      if (fromIndex !== -1 && toIndex !== -1) {
        void store.reorderAiProviders(fromIndex, toIndex)
      }
    },
    [isImage]
  )

  const localeText = useMemo(
    () => ({
      noRowsToShow: isImage ? t('noImageProviders') : t('noProviders'),
    }),
    [isImage, t]
  )

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

      <AddProviderDialog mode={mode} open={addOpen} onClose={onAddClose} />
    </div>
  )
})
