import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import store from '../store'
import type { AiImageProvider, AiMode, AiProvider } from '../types'
import ProviderFields from './ProviderFields'

interface ProviderDetailProps {
  mode: AiMode
}

export default observer(function ProviderDetail({ mode }: ProviderDetailProps) {
  const { t } = useTranslation()
  const isImage = mode === 'image'
  const provider = isImage
    ? store.selectedImageProvider
    : store.selectedProvider
  const [form, setForm] = useState<AiProvider | AiImageProvider | null>(null)

  useEffect(() => {
    setForm(provider ? { ...provider } : null)
  }, [provider?.name, mode])

  if (!provider || !form) {
    return (
      <div
        className={`h-full flex items-center justify-center text-sm ${tw.bg.tertiary} ${tw.text.secondary}`}
      >
        {t('noProviderSelected')}
      </div>
    )
  }

  const handleChange = (patch: Partial<AiProvider | AiImageProvider>) => {
    const next = { ...form, ...patch }
    setForm(next)
    if (patch.models !== undefined) {
      if (isImage) {
        void store.updateAiImageProvider(next as AiImageProvider)
      } else {
        void store.updateAiProvider(next as AiProvider)
      }
    }
  }

  const handleBlur = () => {
    if (isImage) {
      void store.updateAiImageProvider(form as AiImageProvider)
    } else {
      void store.updateAiProvider(form as AiProvider)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('deleteProvider'),
      message: t('deleteProviderConfirm', { name: provider.name }),
      confirmText: t('delete'),
      cancelText: t('cancel'),
    })
    if (!confirmed) return
    if (isImage) {
      await store.deleteAiImageProvider(provider.name)
    } else {
      await store.deleteAiProvider(provider.name)
    }
    toast.success(t('providerDeleted'))
  }

  return (
    <OverlayScrollbars defer className={`h-full min-h-0 ${tw.bg.tertiary}`}>
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
          <ProviderFields mode={mode} value={form} onChange={handleChange} />
        </div>
      </div>
    </OverlayScrollbars>
  )
})
