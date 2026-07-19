import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import { renderQRCode } from '../lib/qr'
import store from '../store'

export default observer(function QRGenerator() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    store.canvasRef = canvasRef
  }, [])

  useEffect(() => {
    if (!store.text || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    let cancelled = false

    renderQRCode(canvas, {
      text: store.text,
      size: store.size,
      fgColor: store.fgColor,
      bgColor: store.bgColor,
      correctLevel: store.correctLevel,
      iconDataUrl: store.iconDataUrl || undefined,
    })
      .then((dataURL) => {
        if (!cancelled) {
          store.setQRCodeDataURL(dataURL)
        }
      })
      .catch((error) => {
        console.error('QR Code generation error:', error)
      })

    return () => {
      cancelled = true
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
