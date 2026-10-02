import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import store from '../store'
import type { ApiType } from '../types'
import {
  API_TYPE_DEFAULT_URL,
  CUSTOM_PRESET_ID,
  POPULAR_PRESETS,
} from '../lib/aiProvider'

interface AddProviderDialogProps {
  open: boolean
  onClose: () => void
}

export default observer(function AddProviderDialog({
  open,
  onClose,
}: AddProviderDialogProps) {
  const { t } = useTranslation()
  const [presetId, setPresetId] = useState(CUSTOM_PRESET_ID)
  const [name, setName] = useState('')
  const [apiType, setApiType] = useState<ApiType>('openai')
  const [apiUrl, setApiUrl] = useState('')

  const isCustom = presetId === CUSTOM_PRESET_ID

  const presetOptions = useMemo(
    () => [
      { value: CUSTOM_PRESET_ID, label: t('customProvider') },
      ...map(POPULAR_PRESETS, (p) => ({ value: p.id, label: p.name })),
    ],
    [t]
  )

  const apiTypeOptions = useMemo(
    () => [
      { value: 'openai', label: t('openaiFormat') },
      { value: 'claude', label: t('claudeFormat') },
    ],
    [t]
  )

  const reset = () => {
    setPresetId(CUSTOM_PRESET_ID)
    setName('')
    setApiType('openai')
    setApiUrl('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handlePresetChange = (value: string) => {
    setPresetId(value)
    if (value === CUSTOM_PRESET_ID) return
    const preset = find(POPULAR_PRESETS, (p) => p.id === value)
    if (!preset) return
    setName(preset.name)
    setApiType(preset.apiType)
    setApiUrl(preset.apiUrl)
  }

  const handleApiTypeChange = (value: string) => {
    if (!isCustom) return
    const next = value as ApiType
    setApiType(next)
    if (isStrBlank(apiUrl)) {
      setApiUrl(API_TYPE_DEFAULT_URL[next])
    }
  }

  const handleSave = async () => {
    const trimmedName = trim(name)
    const trimmedUrl = trim(apiUrl)
    if (isStrBlank(trimmedName)) {
      toast.error(t('nameRequired'))
      return
    }
    if (isStrBlank(trimmedUrl)) {
      toast.error(t('apiUrlRequired'))
      return
    }
    if (find(store.aiProviders, (p) => p.name === trimmedName)) {
      toast.error(t('providerNameExists'))
      return
    }
    await store.addAiProvider({
      name: trimmedName,
      apiType,
      apiUrl: trimmedUrl,
      apiKey: '',
      models: [],
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
        <Select
          value={presetId}
          onChange={handlePresetChange}
          options={presetOptions}
        />
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
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
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('apiType')}
          </label>
          <Select
            value={apiType}
            onChange={handleApiTypeChange}
            options={apiTypeOptions}
            disabled={!isCustom}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={`text-sm font-medium ${tw.text.secondary}`}>
            {t('apiUrl')}
          </label>
          <TextInput
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder={API_TYPE_DEFAULT_URL[apiType]}
            readOnly={!isCustom}
            className={isCustom ? '' : `${tw.text.secondary} cursor-default`}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <DialogButton onClick={handleSave}>{t('save')}</DialogButton>
        </div>
      </div>
    </Dialog>
  )
})
