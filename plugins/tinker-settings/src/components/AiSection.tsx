import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import { confirm } from 'share/components/Confirm'
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

export default observer(function AiSection() {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AiProvider>(emptyProvider())

  const handleAdd = () => {
    setForm({ ...emptyProvider(), id: uuid() })
    setEditingId(null)
    setDialogOpen(true)
  }

  const handleEdit = (provider: AiProvider) => {
    setForm({ ...provider })
    setEditingId(provider.id)
    setDialogOpen(true)
  }

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

  const handleDelete = async (provider: AiProvider) => {
    const confirmed = await confirm({
      title: t('deleteProvider'),
      message: t('deleteProviderConfirm', { name: provider.name }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    })
    if (!confirmed) return

    await store.deleteAiProvider(provider.id)
    toast.success(t('providerDeleted'))
  }

  const dialogTitle = editingId ? t('editProvider') : t('addProvider')

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className={`text-sm font-semibold ${tw.text.secondary}`}>
          {t('aiModels')}
        </h2>
        <button
          onClick={handleAdd}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded ${tw.primary.bg} ${tw.primary.bgHover} text-white`}
        >
          <Plus size={12} />
          {t('addProvider')}
        </button>
      </div>
      <section className={`rounded-lg border ${tw.border} ${tw.bg.secondary}`}>
        {store.aiProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Sparkles size={28} className={`${tw.text.tertiary} opacity-50`} />
            <p className={`text-xs ${tw.text.tertiary}`}>{t('noProviders')}</p>
          </div>
        ) : (
          <ul>
            {store.aiProviders.map((provider, index) => (
              <li key={provider.id}>
                {index > 0 && <div className={`h-px ${tw.bg.border}`} />}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-medium ${tw.text.primary}`}
                      >
                        {provider.name}
                      </span>
                      <span
                        className={`text-xs ${tw.primary.text} ${tw.primary.bgFocused} px-1.5 py-0.5 rounded font-medium`}
                      >
                        {provider.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${tw.text.tertiary} truncate`}>
                        {provider.apiUrl}
                      </span>
                      <span
                        className={`text-xs ${tw.text.tertiary} font-mono shrink-0`}
                      >
                        {maskApiKey(provider.apiKey)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(provider)}
                      className={`p-1.5 rounded ${tw.text.secondary} ${tw.hover} transition-colors`}
                      title={t('edit')}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(provider)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
