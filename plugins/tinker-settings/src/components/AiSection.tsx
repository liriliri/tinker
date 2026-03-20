import { observer } from 'mobx-react-lite'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Plus, Pencil, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { confirm } from 'share/components/Confirm'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import Grid from 'share/components/Grid'
import { ColDef, RowClickedEvent, GetRowIdParams } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import uuid from 'licia/uuid'
import store, { AiProvider } from '../store'

function emptyProvider(): AiProvider {
  return { id: '', name: '', apiUrl: '', apiKey: '', model: '' }
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return ''
  if (apiKey.length <= 8) return '••••••••'
  return apiKey.substring(0, 4) + '••••' + apiKey.substring(apiKey.length - 4)
}

interface RowData {
  id: string
  name: string
  model: string
  apiUrl: string
  apiKey: string
}

export default observer(function AiSection() {
  const { t } = useTranslation()
  const gridRef = useRef<AgGridReact<RowData>>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AiProvider>(emptyProvider())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleAdd = () => {
    setForm({ ...emptyProvider(), id: uuid() })
    setEditingId(null)
    setDialogOpen(true)
  }

  const handleEdit = useCallback((provider: AiProvider) => {
    setForm({ ...provider })
    setEditingId(provider.id)
    setDialogOpen(true)
  }, [])

  const handleClose = () => {
    setDialogOpen(false)
    setEditingId(null)
    setForm(emptyProvider())
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t('nameRequired'))
      return
    }
    if (!form.apiUrl.trim()) {
      toast.error(t('apiUrlRequired'))
      return
    }
    if (!form.apiKey.trim()) {
      toast.error(t('apiKeyRequired'))
      return
    }
    if (!form.model.trim()) {
      toast.error(t('modelRequired'))
      return
    }
    if (editingId) {
      await store.updateAiProvider(form)
      toast.success(t('providerUpdated'))
    } else {
      await store.addAiProvider(form)
      toast.success(t('providerAdded'))
    }
    handleClose()
  }

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

  const handleEditSelected = useCallback(() => {
    if (!selectedId) return
    const provider = store.aiProviders.find((p) => p.id === selectedId)
    if (!provider) return
    handleEdit(provider)
  }, [selectedId, handleEdit])

  const columnDefs: ColDef<RowData>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('providerName'),
        flex: 1,
        minWidth: 120,
        sortable: true,
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
      {
        field: 'apiKey',
        headerName: t('apiKey'),
        flex: 1,
        minWidth: 120,
        sortable: false,
        valueFormatter: (params) => maskApiKey(params.value as string),
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
        apiKey: p.apiKey,
      })),
    [store.aiProviders]
  )

  const onRowClicked = useCallback((event: RowClickedEvent<RowData>) => {
    if (event.data) {
      setSelectedId(event.data.id)
    }
  }, [])

  const getRowId = useCallback(
    (params: GetRowIdParams<RowData>) => params.data.id,
    []
  )

  const getRowClass = useCallback(
    (params: { data?: RowData }) => {
      if (params.data && params.data.id === selectedId) {
        return 'ag-row-selected'
      }
      return ''
    },
    [selectedId]
  )

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.redrawRows()
    }
  }, [selectedId])

  const localeText = useMemo(() => ({ noRowsToShow: t('noProviders') }), [t])

  const dialogTitle = editingId ? t('editProvider') : t('addProvider')

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
        <ToolbarButton onClick={handleAdd} title={t('addProvider')}>
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={handleEditSelected}
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

      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        title={dialogTitle}
        showClose
      >
        <ProviderForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={handleClose}
        />
      </Dialog>
    </div>
  )
})

interface ProviderFormProps {
  form: AiProvider
  setForm: (form: AiProvider) => void
  onSave: () => void
  onCancel: () => void
}

function ProviderForm({ form, setForm, onSave, onCancel }: ProviderFormProps) {
  const { t } = useTranslation()
  const [showApiKey, setShowApiKey] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('providerName')} <span className="text-red-500">*</span>
        </label>
        <TextInput
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder={t('providerName')}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiUrl')} <span className="text-red-500">*</span>
        </label>
        <TextInput
          value={form.apiUrl}
          onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
        />
        <p className={`text-xs ${tw.text.tertiary}`}>{t('apiUrlHint')}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('apiKey')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <TextInput
            type={showApiKey ? 'text' : 'password'}
            value={form.apiKey}
            onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
            placeholder={t('apiKey')}
            className="pr-8"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary} hover:text-gray-600 dark:hover:text-gray-300`}
            title={showApiKey ? t('hideApiKey') : t('showApiKey')}
          >
            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={`text-xs font-medium ${tw.text.secondary}`}>
          {t('model')} <span className="text-red-500">*</span>
        </label>
        <TextInput
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          placeholder="gpt-4o"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <DialogButton variant="text" onClick={onCancel}>
          {t('cancel')}
        </DialogButton>
        <DialogButton onClick={onSave}>{t('save')}</DialogButton>
      </div>
    </div>
  )
}
