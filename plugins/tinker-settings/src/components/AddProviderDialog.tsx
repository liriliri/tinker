import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import uuid from 'licia/uuid'
import store, { ApiType } from '../store'
import { API_TYPE_DEFAULTS } from './aiProviderDefaults'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddProviderDialog({ open, onClose }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [apiType, setApiType] = useState<ApiType>('openai')

  const apiTypeOptions = useMemo(
    () => [
      { value: 'openai', label: t('openaiFormat') },
      { value: 'claude', label: t('claudeFormat') },
    ],
    [t]
  )

  const handleClose = () => {
    setName('')
    setApiType('openai')
    onClose()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t('nameRequired'))
      return
    }
    await store.addAiProvider({
      id: uuid(),
      name: name.trim(),
      apiType,
      apiKey: '',
      ...API_TYPE_DEFAULTS[apiType],
    })
    toast.success(t('providerAdded'))
    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('addProvider')}
      showClose
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {t('providerName')}
          </label>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('providerName')}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-xs font-medium ${tw.text.secondary}`}>
            {t('apiType')}
          </label>
          <Select
            value={apiType}
            onChange={(value) => setApiType(value as ApiType)}
            options={apiTypeOptions}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <DialogButton variant="text" onClick={handleClose}>
            {t('cancel')}
          </DialogButton>
          <DialogButton onClick={handleSave}>{t('save')}</DialogButton>
        </div>
      </div>
    </Dialog>
  )
}
