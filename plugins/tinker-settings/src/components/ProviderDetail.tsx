import { observer } from 'mobx-react-lite'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Trash2 } from 'lucide-react'
import clone from 'licia/clone'
import extend from 'licia/extend'
import { tw } from 'share/theme'
import { confirm } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
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
    setForm(provider ? clone(provider) : null)
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

  const saveProvider = (next: AiProvider | AiImageProvider) => {
    if (isImage) {
      void store.updateAiImageProvider(next as AiImageProvider)
    } else {
      void store.updateAiProvider(next as AiProvider)
    }
  }

  const handleChange = (patch: Partial<AiProvider | AiImageProvider>) => {
    const next = extend(clone(form), patch)
    setForm(next)
    if (patch.models !== undefined) {
      saveProvider(next)
    }
  }

  const handleBlur = () => {
    saveProvider(form)
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
    <div className={`h-full flex flex-col min-h-0 ${tw.bg.tertiary}`}>
      <Toolbar>
        <div className="text-xs font-semibold px-2 truncate min-w-0">
          {provider.name}
        </div>
        <ToolbarSpacer />
        <ToolbarButton onClick={handleDelete} title={t('delete')}>
          <Trash2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <OverlayScrollbars defer className="flex-1 min-h-0">
        <div className="p-4" onBlur={handleBlur}>
          <ProviderFields mode={mode} value={form} onChange={handleChange} />
        </div>
      </OverlayScrollbars>
    </div>
  )
})
