import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Download, Copy, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

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
        <input
          type="range"
          min="128"
          max="512"
          step="32"
          value={store.size}
          onChange={(e) => store.setSize(Number(e.target.value))}
          className="w-20"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400 w-9 text-right">
          {store.size}
        </span>
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
