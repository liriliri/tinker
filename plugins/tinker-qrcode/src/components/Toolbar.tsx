import { observer } from 'mobx-react-lite'
import { Save, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { useCopyToClipboard } from 'share/hooks/useCopyToClipboard'
import { tw } from 'share/theme'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const { copied, copyToClipboard } = useCopyToClipboard()

  const CUSTOM_VALUE = 'custom'
  const sizeOptions = [
    { label: '300', value: 300 },
    { label: '400', value: 400 },
    { label: '500', value: 500 },
    { label: '600', value: 600 },
    { label: t('custom'), value: CUSTOM_VALUE as any },
  ]

  // Determine current select value
  const getCurrentSizeValue = () => {
    if (store.isCustomSize) {
      return CUSTOM_VALUE as any
    }
    const presetSizes = [300, 400, 500, 600]
    if (presetSizes.includes(store.size)) {
      return store.size
    }
    return CUSTOM_VALUE as any
  }

  const handleSizeChange = (value: number | string) => {
    if (value === CUSTOM_VALUE) {
      // User selected custom option
      store.setIsCustomSize(true)
    } else {
      // User selected preset value
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

  const handleCopy = async () => {
    if (!store.canvasRef?.current) return

    try {
      store.canvasRef.current.toBlob(async (blob) => {
        if (!blob) return
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
        await copyToClipboard('') // Trigger the copied state
      })
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Toolbar>
      {/* Size Control */}
      <div className="flex items-center gap-1.5 px-1">
        <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {t('size')}:
        </label>
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
          className={`w-16 text-xs px-2 py-1 ${tw.bg.light.input} ${tw.bg.dark.select} border ${tw.border.both} rounded focus:outline-none ${tw.primary.focusBorder} dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
      </div>

      <ToolbarSeparator />

      {/* Foreground Color */}
      <div className="flex items-center gap-1.5 px-1">
        <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {t('color')}:
        </label>
        <input
          type="color"
          value={store.fgColor}
          onChange={(e) => store.setFgColor(e.target.value)}
          className="h-5 w-10 cursor-pointer rounded border-0"
        />
      </div>

      {/* Background Color */}
      <div className="flex items-center gap-1.5 px-1">
        <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {t('background')}:
        </label>
        <input
          type="color"
          value={store.bgColor}
          onChange={(e) => store.setBgColor(e.target.value)}
          className="h-5 w-10 cursor-pointer rounded border-0"
        />
      </div>

      <ToolbarSpacer />

      {/* Action Buttons */}
      <ToolbarButton
        onClick={handleCopy}
        disabled={!store.text}
        className={copied ? tw.primary.text : ''}
        title={t('copy')}
      >
        {copied ? (
          <Check size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Copy size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>

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
