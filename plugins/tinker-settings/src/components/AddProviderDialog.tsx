import { useState, useMemo, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import concat from 'licia/concat'
import find from 'licia/find'
import isStrBlank from 'licia/isStrBlank'
import map from 'licia/map'
import trim from 'licia/trim'
import { tw } from 'share/theme'
import TextInput from 'share/components/TextInput'
import Dialog, { DialogButton } from 'share/components/Dialog'
import Select from 'share/components/Select'
import store from '../store'
import type { AiMode, ApiType, ImageApiType } from '../types'
import {
  API_TYPE_DEFAULT_URL,
  CUSTOM_PRESET_ID,
  IMAGE_API_TYPE_DEFAULT_URL,
  IMAGE_PRESETS,
  POPULAR_PRESETS,
} from '../lib/aiProvider'

interface AddProviderDialogProps {
  mode: AiMode
  open: boolean
  onClose: () => void
}

export default observer(function AddProviderDialog({
  mode,
  open,
  onClose,
}: AddProviderDialogProps) {
  const { t } = useTranslation()
  const isImage = mode === 'image'
  const [presetId, setPresetId] = useState(CUSTOM_PRESET_ID)
  const [name, setName] = useState('')
  const [apiType, setApiType] = useState<string>('openai')
  const [apiUrl, setApiUrl] = useState('')

  const isCustom = presetId === CUSTOM_PRESET_ID

  useEffect(() => {
    if (!open) return
    setPresetId(CUSTOM_PRESET_ID)
    setName('')
    setApiType('openai')
    setApiUrl('')
  }, [open, mode])

  const imageApiTypeOptions = useMemo(
    () =>
      map(IMAGE_PRESETS, (p) => ({
        value: p.apiType,
        label: t(`${p.apiType}Format`),
      })),
    [t]
  )

  const presetOptions = useMemo(() => {
    const custom = { value: CUSTOM_PRESET_ID, label: t('customProvider') }
    if (isImage) {
      return concat([custom], imageApiTypeOptions)
    }
    return concat(
      [custom],
      map(POPULAR_PRESETS, (p) => ({
        value: p.id,
        label: p.name,
      }))
    )
  }, [imageApiTypeOptions, isImage, t])

  const apiTypeOptions = useMemo(
    () =>
      isImage
        ? imageApiTypeOptions
        : [
            { value: 'openai', label: t('openaiFormat') },
            { value: 'claude', label: t('claudeFormat') },
          ],
    [imageApiTypeOptions, isImage, t]
  )

  const defaultUrls = isImage
    ? IMAGE_API_TYPE_DEFAULT_URL
    : API_TYPE_DEFAULT_URL
  const defaultUrl =
    defaultUrls[apiType as keyof typeof defaultUrls] || defaultUrls.openai

  const handlePresetChange = (value: string) => {
    setPresetId(value)
    if (value === CUSTOM_PRESET_ID) return
    if (isImage) {
      const preset = find(IMAGE_PRESETS, (p) => p.apiType === value)
      if (!preset) return
      setName(t(`${preset.apiType}Format`))
      setApiType(preset.apiType)
      setApiUrl(preset.apiUrl)
      return
    }
    const preset = find(POPULAR_PRESETS, (p) => p.id === value)
    if (!preset) return
    setName(preset.name)
    setApiType(preset.apiType)
    setApiUrl(preset.apiUrl)
  }

  const handleApiTypeChange = (value: string) => {
    if (!isCustom) return
    setApiType(value)
    if (isStrBlank(apiUrl)) {
      setApiUrl(
        defaultUrls[value as keyof typeof defaultUrls] || defaultUrls.openai
      )
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
    const existing = isImage
      ? find(store.aiImageProviders, (p) => p.name === trimmedName)
      : find(store.aiProviders, (p) => p.name === trimmedName)
    if (existing) {
      toast.error(t('providerNameExists'))
      return
    }
    if (isImage) {
      await store.addAiImageProvider({
        name: trimmedName,
        apiType: apiType as ImageApiType,
        apiUrl: trimmedUrl,
        apiKey: '',
        models: [],
      })
    } else {
      await store.addAiProvider({
        name: trimmedName,
        apiType: apiType as ApiType,
        apiUrl: trimmedUrl,
        apiKey: '',
        models: [],
      })
    }
    toast.success(t('providerAdded'))
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title={t('addProvider')} showClose>
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
            placeholder={defaultUrl}
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
