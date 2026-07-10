import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, ListX } from 'lucide-react'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
  ToolbarTextInput,
} from 'share/components/Toolbar'
import store from '../store'
import {
  clampQuality,
  MAX_QUALITY,
  MIN_QUALITY,
  PRESET_QUALITIES,
  QUALITY_PRESETS,
} from '../lib/compress'

const CUSTOM_VALUE = 'custom'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [qualityInput, setQualityInput] = useState(String(store.quality))

  useEffect(() => {
    if (!store.isCustomQuality) {
      setQualityInput(String(store.quality))
    }
  }, [store.quality, store.isCustomQuality])

  const qualityOptions = useMemo(
    () => [
      ...QUALITY_PRESETS.map((level) => ({
        label: t(level.labelKey),
        value: level.value,
      })),
      { label: t('custom'), value: CUSTOM_VALUE },
    ],
    [t]
  )

  const getCurrentQualityValue = (): number | string => {
    if (store.isCustomQuality) {
      return CUSTOM_VALUE
    }
    if (PRESET_QUALITIES.includes(store.quality)) {
      return store.quality
    }
    return CUSTOM_VALUE
  }

  const handleQualityChange = (value: number | string) => {
    if (value === CUSTOM_VALUE) {
      store.setIsCustomQuality(true)
      setQualityInput(String(store.quality))
      return
    }

    store.setQuality(value as number)
    store.setIsCustomQuality(false)
  }

  const handleCustomQualityChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }

    const numValue = Number(value)
    if (value !== '' && numValue > MAX_QUALITY) {
      return
    }

    setQualityInput(value)

    if (value !== '' && numValue >= MIN_QUALITY && numValue <= MAX_QUALITY) {
      store.setQuality(numValue)
    }
  }

  const handleCustomQualityBlur = () => {
    let numValue = Number(qualityInput)
    if (qualityInput === '' || isNaN(numValue)) {
      numValue = store.quality
    }

    numValue = clampQuality(numValue)
    store.setQuality(numValue)
    setQualityInput(String(numValue))
  }

  const handleOverwriteChange = (checked: boolean) => {
    store.setOverwriteOriginal(checked)
  }

  const handleCompress = async () => {
    await store.compressAll()
  }

  const handleOpenImage = async () => {
    await store.openImageDialog()
  }

  const handleSaveImage = async () => {
    await store.saveAll()
  }

  const handleClear = () => {
    store.clear()
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpenImage} title={t('openImage')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={!store.hasImages}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleSaveImage}
        disabled={!store.hasUnsaved}
        title={t('saveImage')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <Checkbox
        checked={store.overwriteOriginal}
        onChange={handleOverwriteChange}
      >
        {t('overwriteOriginal')}
      </Checkbox>

      <ToolbarSpacer />

      {store.hasImages && (
        <>
          <Checkbox
            checked={store.keepExif}
            onChange={(checked) => store.setKeepExif(checked)}
          >
            {t('keepExif')}
          </Checkbox>

          <ToolbarSeparator />

          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('quality')}:`}</ToolbarLabel>
            <Select
              value={getCurrentQualityValue()}
              onChange={handleQualityChange}
              options={qualityOptions}
              disabled={store.isCompressing}
            />
            <ToolbarTextInput
              type="text"
              inputMode="numeric"
              value={qualityInput}
              onChange={handleCustomQualityChange}
              onBlur={handleCustomQualityBlur}
              disabled={!store.isCustomQuality || store.isCompressing}
              className="!w-14 px-1 text-center"
            />
          </div>

          <ToolbarSeparator />

          <ToolbarTextButton
            onClick={handleCompress}
            disabled={store.isCompressing || !store.hasUncompressed}
          >
            {t('compress')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
