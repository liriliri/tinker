import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
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

    QRCode.toCanvas(
      canvasRef.current,
      store.text,
      {
        width: store.size,
        margin: 2,
        errorCorrectionLevel: store.correctLevel,
        color: {
          dark: store.fgColor,
          light: store.bgColor,
        },
      },
      (error) => {
        if (error) {
          console.error('QR Code generation error:', error)
          return
        }

        // Save canvas as data URL
        const dataURL = canvasRef.current?.toDataURL('image/png')
        if (dataURL) {
          store.setQRCodeDataURL(dataURL)
        }
      }
    )
  }, [store.text, store.size, store.fgColor, store.bgColor, store.correctLevel])

  return (
    <div className="h-full flex">
      {/* Left Panel - Text Input */}
      <div
        className={`flex-1 min-w-0 flex flex-col border-r ${tw.border.both}`}
      >
        <div className={`flex-1 ${tw.bg.light.primary} ${tw.bg.dark.primary}`}>
          <textarea
            value={store.text}
            onChange={(e) => store.setText(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm resize-none"
          />
        </div>
      </div>

      {/* Right Panel - QR Code Display */}
      <div
        className={`flex-1 min-w-0 flex items-center justify-center ${tw.bg.light.secondary} ${tw.bg.dark.secondary} p-4`}
      >
        {store.text ? (
          <div
            className="rounded-lg"
            style={{
              padding: '12px',
              backgroundColor: store.bgColor,
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 px-4">
            <div className="text-base mb-1">{t('emptyTitle')}</div>
            <div className="text-sm opacity-75">{t('emptySubtitle')}</div>
          </div>
        )}
      </div>
    </div>
  )
})
