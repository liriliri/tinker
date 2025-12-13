import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import store from '../store'

const QRGenerator = observer(() => {
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
  }, [store.text, store.size, store.fgColor, store.bgColor])

  return (
    <div className="h-full flex">
      {/* Left Panel - Text Input */}
      <div className="w-1/2 flex flex-col border-r border-[#e0e0e0] dark:border-[#4a4a4a]">
        <div className="flex-1 bg-white dark:bg-[#1e1e1e]">
          <textarea
            value={store.text}
            onChange={(e) => store.setText(e.target.value)}
            placeholder={t('placeholder')}
            className="w-full h-full px-3 py-2 border-0 focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm resize-none"
          />
        </div>
      </div>

      {/* Right Panel - QR Code Display */}
      <div className="w-1/2 flex items-center justify-center bg-white dark:bg-[#1e1e1e]">
        {store.text ? (
          <div className="p-8">
            <div
              className="rounded-lg inline-block"
              style={{ padding: '12px', backgroundColor: store.bgColor }}
            >
              <canvas ref={canvasRef} />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-600 px-4">
            <div className="text-base mb-1">{t('emptyTitle')}</div>
            <div className="text-sm opacity-75">{t('emptySubtitle')}</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default QRGenerator
