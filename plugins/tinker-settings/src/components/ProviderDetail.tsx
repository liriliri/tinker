import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import store from '../store'
import type { AiProvider } from '../types'
import ProviderFields from './ProviderFields'

export default observer(function ProviderDetail() {
  const { t } = useTranslation()
  const [form, setForm] = useState<AiProvider | null>(null)

  const provider = store.selectedProvider

  useEffect(() => {
    setForm(provider ? { ...provider } : null)
  }, [provider?.name])

  if (!provider || !form) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.bg.tertiary} ${tw.text.secondary}`}
      >
        {t('noProviderSelected')}
      </div>
    )
  }

  const handleChange = (patch: Partial<AiProvider>) => {
    setForm({ ...form, ...patch })
  }

  const handleBlur = () => {
    store.updateAiProvider(form)
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('deleteProvider'),
      message: t('deleteProviderConfirm', { name: provider.name }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    })
    if (!confirmed) return
    await store.deleteAiProvider(provider.name)
    toast.success(t('providerDeleted'))
  }

  return (
    <div className={`h-full overflow-y-auto ${tw.bg.tertiary}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold truncate">{provider.name}</h2>
          <button
            onClick={handleDelete}
            className={`p-2 rounded ${tw.hover} text-red-600 dark:text-red-400 flex-shrink-0`}
            title={t('delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
        <div onBlur={handleBlur}>
          <ProviderFields value={form} onChange={handleChange} />
        </div>
      </div>
    </div>
  )
})
