import { observer } from 'mobx-react-lite'
import { useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCw } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { THEME_COLORS } from 'share/theme'
import store from './store'
import ControlBar from './components/ControlBar'
import CameraVideo from './components/CameraVideo'

export default observer(function App() {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = useCallback(async () => {
    store.setLoading(true)
    store.setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })

      store.setStream(stream)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t('cameraAccessError')
      store.setError(errorMessage)

      toast.error(errorMessage)
    } finally {
      store.setLoading(false)
    }
  }, [t])

  useEffect(() => {
    startCamera()

    return () => {
      store.stopStream()
    }
  }, [startCamera])

  return (
    <div className="h-screen w-screen flex items-center justify-center relative bg-black">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-text, #333)',
          },
          success: {
            iconTheme: {
              primary: THEME_COLORS.primary,
              secondary: THEME_COLORS.bg.light.primary,
            },
          },
        }}
      />
      {store.isLoading && (
        <div className="text-lg text-white">{t('loading')}</div>
      )}

      {store.error && (
        <button
          onClick={startCamera}
          className="flex flex-col items-center gap-3 text-white hover:text-gray-300 transition-colors"
        >
          <RotateCw size={48} />
          <span className="text-sm">{t('retry')}</span>
        </button>
      )}

      <CameraVideo videoRef={videoRef} />
      <ControlBar videoRef={videoRef} />
    </div>
  )
})
