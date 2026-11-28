import { observer } from 'mobx-react-lite'
import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import contain from 'licia/contain'
import filter from 'licia/filter'
import findIdx from 'licia/findIdx'
import isEmpty from 'licia/isEmpty'
import lowerCase from 'licia/lowerCase'
import map from 'licia/map'
import some from 'licia/some'
import trim from 'licia/trim'
import Grid from 'share/components/Grid'
import { confirm } from 'share/components/Confirm'
import { showContextMenu } from 'share/components/ContextMenu'
import {
  CellContextMenuEvent,
  ColDef,
  GetRowIdParams,
  ICellRendererParams,
  RowClickedEvent,
  RowDragEndEvent,
  IRowDragItem,
} from 'ag-grid-community'
import store from '../store'
import type { AiMode } from '../types'
import { resolveProviderBrand, type ProviderBrand } from '../lib/aiProvider'
import AddProviderDialog from './AddProviderDialog'
import ClaudeIcon from '../assets/claude.svg?react'
import DeepSeekIcon from '../assets/deepseek.svg?react'
import GeminiIcon from '../assets/gemini.svg?react'
import MiniMaxIcon from '../assets/minimax.svg?react'
import OpenAIIcon from '../assets/openai.svg?react'
import OpenRouterIcon from '../assets/openrouter.svg?react'
import VolcengineIcon from '../assets/volcengine.svg?react'

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
  onAdded: (name: string) => void
  onEdit: (name: string) => void
}

const PROVIDER_ICONS: Record<ProviderBrand, typeof OpenAIIcon> = {
  openai: OpenAIIcon,
  claude: ClaudeIcon,
  gemini: GeminiIcon,
  volcengine: VolcengineIcon,
  openrouter: OpenRouterIcon,
  minimax: MiniMaxIcon,
  deepseek: DeepSeekIcon,
}

const DEFAULT_COL_DEF = { sortable: false }

interface ProviderLike {
  name: string
  apiUrl: string
  apiType: string
  models: Array<{ name: string }>
}

function ProviderNameCell({ data }: ICellRendererParams<RowData>) {
  if (!data) return null
  const Icon = PROVIDER_ICONS[resolveProviderBrand(data.apiUrl, data.apiType)]
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{data.name}</span>
    </div>
  )
}

export default observer(function AiSection({
  mode,
  search,
  addOpen,
  onAddClose,
  onAdded,
  onEdit,
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

  const matchesSearch = (p: ProviderLike) =>
    isEmpty(keyword) ||
    contain(lowerCase(p.name), keyword) ||
    some(p.models, (m) => contain(lowerCase(m.name), keyword)) ||
    contain(lowerCase(p.apiUrl), keyword)

  const toRow = (p: ProviderLike): RowData => ({
    name: p.name,
    defaultModel: p.models[0]?.name ?? '',
    apiUrl: p.apiUrl,
    apiType: p.apiType,
  })

  const providers = isImage ? store.aiImageProviders : store.aiProviders
  const rowData: RowData[] = map(filter(providers, matchesSearch), toRow)

  const onRowClicked = useCallback(
    (event: RowClickedEvent<RowData>) => {
      if (!event.data) return
      const mouse = event.event as MouseEvent | undefined
      if (mouse && mouse.button !== 0) return
      onEdit(event.data.name)
    },
    [onEdit]
  )

  const deleteProvider = useCallback(
    async (name: string) => {
      const confirmed = await confirm({
        title: t('deleteProvider'),
        message: t('deleteProviderConfirm', { name }),
        confirmText: t('delete'),
        cancelText: t('cancel'),
      })
      if (!confirmed) return
      if (isImage) {
        await store.deleteAiImageProvider(name)
      } else {
        await store.deleteAiProvider(name)
      }
      toast.success(t('providerDeleted'))
    },
    [isImage, t]
  )

  const onCellContextMenu = useCallback(
    (event: CellContextMenuEvent<RowData>) => {
      if (!event.data || !event.event) return
      const e = event.event as MouseEvent
      e.preventDefault()
      const name = event.data.name
      showContextMenu(e.clientX, e.clientY, [
        {
          label: t('edit'),
          click: () => onEdit(name),
        },
        {
          label: t('delete'),
          click: () => {
            void deleteProvider(name)
          },
        },
      ])
    },
    [deleteProvider, onEdit, t]
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
      const list: Array<{ name: string }> = isImage
        ? store.aiImageProviders
        : store.aiProviders
      const fromIndex = findIdx(list, (p) => p.name === fromName)
      const toIndex = findIdx(list, (p) => p.name === toName)
      if (fromIndex === -1 || toIndex === -1) return
      if (isImage) {
        void store.reorderAiImageProviders(fromIndex, toIndex)
      } else {
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
        defaultColDef={DEFAULT_COL_DEF}
        onRowClicked={onRowClicked}
        onCellContextMenu={onCellContextMenu}
        getRowId={getRowId}
        animateRows={false}
        enableCellTextSelection={false}
        suppressCellFocus={true}
        rowDragEntireRow={true}
        rowDragText={(params: IRowDragItem) => params.rowNode?.data?.name ?? ''}
        onRowDragEnd={onRowDragEnd}
        localeText={localeText}
      />

      <AddProviderDialog
        mode={mode}
        open={addOpen}
        onClose={onAddClose}
        onAdded={onAdded}
      />
    </div>
  )
})
