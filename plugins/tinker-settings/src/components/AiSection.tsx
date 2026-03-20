import { observer } from 'mobx-react-lite'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Grid from 'share/components/Grid'
import { confirm } from 'share/components/Confirm'
import {
  ColDef,
  RowClickedEvent,
  GetRowIdParams,
  ICellRendererParams,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import store from '../store'
import AddProviderDialog from './AddProviderDialog'
import EditProviderDialog from './EditProviderDialog'
import ClaudeIcon from '../assets/claude.svg?react'
import OpenAIIcon from '../assets/openai.svg?react'

interface RowData {
  id: string
  name: string
  model: string
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

export default observer(function AiSection() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<RowData>>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedProvider = useMemo(
    () => store.aiProviders.find((p) => p.id === selectedId) ?? null,
    [selectedId, store.aiProviders]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedId) return
    const provider = store.aiProviders.find((p) => p.id === selectedId)
    if (!provider) return

    const confirmed = await confirm({
      title: t('deleteProvider'),
      message: t('deleteProviderConfirm', { name: provider.name }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    })
    if (!confirmed) return

    await store.deleteAiProvider(provider.id)
    setSelectedId(null)
    toast.success(t('providerDeleted'))
  }, [selectedId, t])

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
        field: 'model',
        headerName: t('model'),
        flex: 1,
        minWidth: 120,
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

  const rowData = useMemo<RowData[]>(
    () =>
      store.aiProviders.map((p) => ({
        id: p.id,
        name: p.name,
        model: p.model,
        apiUrl: p.apiUrl,
        apiType: p.apiType ?? 'openai',
      })),
    [store.aiProviders]
  )

  const onRowClicked = useCallback((event: RowClickedEvent<RowData>) => {
    if (event.data) setSelectedId(event.data.id)
  }, [])

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const getRowClass = useCallback(
    (params: { data?: RowData }) =>
      params.data?.id === selectedId ? 'ag-row-selected' : '',
    [selectedId]
  )

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [selectedId])

  const localeText = useMemo(() => ({ noRowsToShow: t('noProviders') }), [t])

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
        <ToolbarButton
          onClick={() => setAddOpen(true)}
          title={t('addProvider')}
        >
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => setEditOpen(true)}
          disabled={!selectedId}
          title={t('edit')}
        >
          <Pencil size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarButton
          onClick={handleDelete}
          disabled={!selectedId}
          title={t('delete')}
        >
          <Trash2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>

      <div className="flex-1 overflow-hidden">
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
      </div>

      <AddProviderDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <EditProviderDialog
        open={editOpen}
        provider={selectedProvider}
        onClose={() => setEditOpen(false)}
      />
    </div>
  )
})
