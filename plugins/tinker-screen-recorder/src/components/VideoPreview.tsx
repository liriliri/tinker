import { observer } from 'mobx-react-lite'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

interface VideoPreviewProps {
  stream: MediaStream | null
  className?: string
}

export default observer(function VideoPreview({
  stream,
  className = '',
}: VideoPreviewProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewUrl = useMemo(
    () => (store.recordedBlob ? URL.createObjectURL(store.recordedBlob) : ''),
    [store.recordedBlob]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (stream) {
      video.srcObject = stream
      video.removeAttribute('src')
      void video.play().catch(() => {})
      return
    }

    video.srcObject = null
    if (previewUrl) {
      video.src = previewUrl
      void video.play().catch(() => {})
    } else {
      video.removeAttribute('src')
      video.load()
    }
  }, [stream, previewUrl])

  const showThumbnail =
    !stream && !store.isPreview && !!store.selectedSource?.thumbnail

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-black ${className}`}
    >
      <video
        ref={videoRef}
        className={`max-w-full max-h-full bg-black ${
          stream || store.isPreview ? 'block' : 'hidden'
        }`}
        muted={!!stream}
        playsInline
        controls={store.isPreview}
      />
      {showThumbnail ? (
        <img
          src={store.selectedSource!.thumbnail}
          alt={store.selectedSource!.name}
          className="max-w-full max-h-full object-contain"
        />
      ) : null}
      {!stream && !store.isPreview && !showThumbnail ? (
        <span className={`text-sm ${tw.text.tertiary}`}>
          {t('selectSource')}
        </span>
      ) : null}
    </div>
  )
})
