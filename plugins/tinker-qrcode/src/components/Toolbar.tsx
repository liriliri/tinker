import { observer } from 'mobx-react-lite'
import { Save, Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import openFile from 'licia/openFile'
import store from '../store'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarColor,
  ToolbarLabel,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'

const CUSTOM_VALUE = 'custom'

const PRESET_SIZE_OPTIONS: { label: string; value: number }[] = [
  { label: '300', value: 300 },
  { label: '400', value: 400 },
  { label: '500', value: 500 },
  { label: '600', value: 600 },
]

const CORRECT_LEVEL_OPTIONS: { label: string; value: string }[] = [
  { label: 'L (7%)', value: 'L' },
  { label: 'M (15%)', value: 'M' },
  { label: 'Q (25%)', value: 'Q' },
  { label: 'H (30%)', value: 'H' },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const sizeOptions: { label: string; value: number | string }[] = [
    ...PRESET_SIZE_OPTIONS,
    { label: t('custom'), value: CUSTOM_VALUE },
  ]

  const getCurrentSizeValue = (): number | string => {
    if (store.isCustomSize) {
      return CUSTOM_VALUE
    }
    if (PRESET_SIZE_OPTIONS.some((o) => o.value === store.size)) {
      return store.size
    }
    return CUSTOM_VALUE
  }

  const handleSizeChange = (value: number | string) => {
    if (value === CUSTOM_VALUE) {
      store.setIsCustomSize(true)
    } else {
      store.setSize(value as number)
      store.setIsCustomSize(false)
    }
  }

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= 100 && numValue <= 2000) {
      store.setSize(numValue)
    }
  }

  const handleDownload = () => {
    if (!store.qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = 'qrcode.png'
    link.href = store.qrCodeDataURL
    link.click()
  }

  const handleSetIcon = async () => {
    const files = await openFile({ accept: 'image/*' })
    if (files && files.length > 0) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result
        if (typeof dataUrl === 'string') store.setIcon(dataUrl)
      }
      reader.readAsDataURL(files[0])
    }
  }

  return (
    <Toolbar>
      {/* Size Control */}
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('size')}:`}</ToolbarLabel>
        <Select
          value={getCurrentSizeValue()}
          onChange={handleSizeChange}
          options={sizeOptions}
        />
        <input
          type="number"
          value={store.size}
          onChange={handleCustomInputChange}
          disabled={!store.isCustomSize}
          min="100"
          max="2000"
          className={`w-16 text-xs px-2 py-1 border rounded focus:outline-none dark:text-gray-200 ${tw.bg.input} ${tw.border} ${tw.primary.focusBorder} disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>

      <ToolbarSeparator />

      {/* Error Correction Level */}
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('correctLevel')}:`}</ToolbarLabel>
        <Select
          value={store.correctLevel}
          onChange={(value) =>
            store.setCorrectLevel(value as 'L' | 'M' | 'Q' | 'H')
          }
          options={CORRECT_LEVEL_OPTIONS}
        />
      </div>

      <ToolbarSeparator />

      {/* Foreground Color */}
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('color')}:`}</ToolbarLabel>
        <ToolbarColor
          value={store.fgColor}
          onChange={(e) => store.setFgColor(e.target.value)}
        />
      </div>

      {/* Background Color */}
      <div className="flex items-center gap-1.5 px-1">
        <ToolbarLabel>{`${t('background')}:`}</ToolbarLabel>
        <ToolbarColor
          value={store.bgColor}
          onChange={(e) => store.setBgColor(e.target.value)}
        />
      </div>

      <ToolbarSeparator />

      {/* Icon */}
      <ToolbarButton
        onClick={handleSetIcon}
        menu={
          store.iconDataUrl
            ? [{ label: t('clearIcon'), click: () => store.clearIcon() }]
            : undefined
        }
        title={t('setIcon')}
      >
        <Image size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSpacer />

      <ToolbarButton
        onClick={handleDownload}
        disabled={!store.text}
        title={t('save')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
