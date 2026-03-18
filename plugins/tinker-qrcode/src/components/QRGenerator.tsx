import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { renderQRToCanvas } from '../lib/qr'
import store from '../store'

export default observer(function QRGenerator() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Store canvas ref in store for toolbar access
  useEffect(() => {
    store.canvasRef = canvasRef
  }, [])

  useEffect(() => {
    if (!store.text || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current

    try {
      renderQRToCanvas(
        canvas,
        store.text,
        store.size,
        store.fgColor,
        store.bgColor,
        store.correctLevel
      )
    } catch (error) {
      console.error('QR Code generation error:', error)
      return
    }

    const drawDataUrl = () => {
      const dataURL = canvas.toDataURL('image/png')
      store.setQRCodeDataURL(dataURL)
    }

    if (store.iconDataUrl) {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        drawDataUrl()
        return
      }
      const img = new Image()
      img.onload = () => {
        const iconSize = canvas.width * 0.2
        const x = (canvas.width - iconSize) / 2
        const y = (canvas.height - iconSize) / 2
        const padding = iconSize * 0.1
        ctx.fillStyle = store.bgColor
        ctx.fillRect(
          x - padding,
          y - padding,
          iconSize + padding * 2,
          iconSize + padding * 2
        )
        ctx.drawImage(img, x, y, iconSize, iconSize)
        drawDataUrl()
      }
      img.src = store.iconDataUrl
    } else {
      drawDataUrl()
    }
  }, [store.text, store.size, store.fgColor, store.bgColor, store.correctLevel, store.iconDataUrl])

  return (
    <div className="h-full flex">
      <div className={`flex-1 min-w-0 flex flex-col border-r ${tw.border}`}>
        <div className="flex-1">
          <textarea
            value={store.text}
            onChange={(e) => store.setText(e.target.value)}
            placeholder={t('placeholder')}
            className={`w-full h-full p-4 resize-none outline-none overflow-x-hidden whitespace-pre-wrap break-words ${tw.bg.primary} ${tw.text.primary}`}
          />
        </div>
      </div>

      <div
        className={`flex-1 min-w-0 flex items-center justify-center ${tw.bg.tertiary} p-4`}
      >
        {store.text ? (
          <div
            onClick={() => store.copyQRCodeToClipboardWithToast()}
            title={t('copy')}
            className="rounded-lg p-3 max-w-full max-h-full aspect-square flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: store.bgColor }}
          >
            <canvas
              ref={canvasRef}
              className="block max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        ) : (
          <div className={`text-center px-4 ${tw.text.secondary}`}>
            <div className="text-base mb-1">{t('emptyTitle')}</div>
            <div className="text-sm opacity-75">{t('emptySubtitle')}</div>
          </div>
        )}
      </div>
    </div>
  )
})
