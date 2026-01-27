import { observer } from 'mobx-react-lite'
import { useEffect, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import store from '../store'

interface CameraVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>
}

export default observer(function CameraVideo({ videoRef }: CameraVideoProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (store.stream && videoRef.current) {
      videoRef.current.srcObject = store.stream
      videoRef.current.play().catch((err) => {
        const errorMessage =
          err instanceof Error ? err.message : t('playbackError')
        store.setError(errorMessage)
        toast.error(errorMessage)
      })
    }
  }, [store.stream, t, videoRef])

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ transform: 'scaleX(-1)' }}
      className={`w-full h-full object-cover ${
        store.stream && !store.error && !store.isLoading ? '' : 'hidden'
      }`}
    />
  )
})
