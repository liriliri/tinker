import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import Select from 'share/components/Select'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

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
    const presetSizes = [300, 400, 500, 600]
    if (presetSizes.includes(store.size)) {
      return store.size
    }
    return CUSTOM_VALUE as any
  }

  const isCustomSize = getCurrentSizeValue() === CUSTOM_VALUE

  const handleSizeChange = (value: number | string) => {
    if (value !== CUSTOM_VALUE) {
      store.setSize(value as number)
    }
  }

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = Number(value)
    if (!isNaN(numValue) && numValue >= 100 && numValue <= 2000) {
      store.setSize(numValue)
    }
  }

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`

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
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
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
          disabled={!isCustomSize}
          min="100"
          max="2000"
          className="w-16 text-xs px-2 py-1 bg-white dark:bg-[#3e3e42] border border-[#e0e0e0] dark:border-[#4a4a4a] rounded focus:outline-none focus:border-[#0fc25e] dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="w-px h-5 bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

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

      <div className="w-px h-5 bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      {/* Action Buttons */}
      <button
        onClick={handleCopy}
        disabled={!store.text}
        className={
          copied
            ? `${baseButtonClass} text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c]`
            : actionButtonClass
        }
        title={t('copy')}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </button>

      <button
        onClick={handleDownload}
        disabled={!store.text}
        className={actionButtonClass}
        title={t('download')}
      >
        <Download size={iconSize} />
      </button>

      <div className="flex-1" />

      {/* Info */}
      {store.text && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-1 whitespace-nowrap">
          {store.text.length} {t('characters')}
        </div>
      )}
    </div>
  )
})
