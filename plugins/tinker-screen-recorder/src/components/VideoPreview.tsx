import { observer } from 'mobx-react-lite'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import createUrl from 'licia/createUrl'
import VideoPlayer from 'share/components/VideoPlayer'
import store from '../store'

interface VideoPreviewProps {
  stream: MediaStream | null
  className?: string
}

export default observer(function VideoPreview({
  stream,
  className = '',
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewUrl = useMemo(
    () => (store.recordedBlob ? createUrl(store.recordedBlob) : ''),
    [store.recordedBlob]
  )
  const player = useMemo(
    () => createPlayer({ features: videoFeatures }),
    [previewUrl]
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useLayoutEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream
    void video.play().catch(() => {})
    return () => {
      video.pause()
      video.srcObject = null
      video.removeAttribute('src')
      video.load()
    }
  }, [stream])

  if (stream) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-black ${className}`}
      >
        <video
          ref={videoRef}
          className="max-w-full max-h-full bg-black"
          muted
          playsInline
        />
      </div>
    )
  }

  if (!previewUrl) return null

  const { Provider, Container } = player

  return (
    <div className={`overflow-hidden ${className}`}>
      <Provider>
        <Container className="h-full">
          <VideoPlayer>
            <Video key={previewUrl} src={previewUrl} autoPlay />
          </VideoPlayer>
        </Container>
      </Provider>
    </div>
  )
})
