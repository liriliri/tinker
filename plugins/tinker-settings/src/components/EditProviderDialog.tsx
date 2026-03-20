import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import store, { AiProvider } from '../store'

interface Props {
  open: boolean
  provider: AiProvider | null
  onClose: () => void
}

export default function EditProviderDialog({ open, provider, onClose }: Props) {
  const { t } = useTranslation()
  const [form, setForm] = useState<AiProvider | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  // Sync form when provider changes (dialog opens)
  const activeForm = form ?? provider

  const handleClose = () => {
    setForm(null)
    setShowApiKey(false)
    onClose()
  }

  const handleSave = async () => {
    if (!activeForm) return
    if (!activeForm.apiUrl.trim()) {
      toast.error(t('apiUrlRequired'))
      return
    }
    if (!activeForm.apiKey.trim()) {
      toast.error(t('apiKeyRequired'))
      return
    }
    if (!activeForm.model.trim()) {
      toast.error(t('modelRequired'))
      return
    }
    await store.updateAiProvider(activeForm)
    toast.success(t('providerUpdated'))
    handleClose()
  }

  const update = (patch: Partial<AiProvider>) => {
    if (!activeForm) return
    setForm({ ...activeForm, ...patch })
  }

  const isClaude = (activeForm?.apiType ?? 'openai') === 'claude'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={activeForm?.name ?? t('editProvider')}
      showClose
    >
      {activeForm && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${tw.text.secondary}`}>
              {t('apiUrl')}
            </label>
            <TextInput
              value={activeForm.apiUrl}
              onChange={(e) => update({ apiUrl: e.target.value })}
              placeholder={
                isClaude
                  ? 'https://api.anthropic.com'
                  : 'https://api.openai.com/v1'
              }
            />
            <p className={`text-xs ${tw.text.tertiary}`}>
              {isClaude ? t('claudeApiUrlHint') : t('apiUrlHint')}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${tw.text.secondary}`}>
              {t('apiKey')}
            </label>
            <div className="relative">
              <TextInput
                type={showApiKey ? 'text' : 'password'}
                value={activeForm.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
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
              {t('model')}
            </label>
            <TextInput
              value={activeForm.model}
              onChange={(e) => update({ model: e.target.value })}
              placeholder={isClaude ? 'claude-opus-4-5' : 'gpt-4o'}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <DialogButton variant="text" onClick={handleClose}>
              {t('cancel')}
            </DialogButton>
            <DialogButton onClick={handleSave}>{t('save')}</DialogButton>
          </div>
        </div>
      )}
    </Dialog>
  )
}
