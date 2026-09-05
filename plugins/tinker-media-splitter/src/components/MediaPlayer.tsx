import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { Music } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function MediaPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const src = store.media?.src ?? ''

  useEffect(() => {
    if (store.seekRequest == null) return
    const video = videoRef.current
    if (video) {
      video.currentTime = store.seekRequest
    }
    store.clearSeekRequest()
  }, [store.seekRequest])

  useEffect(() => {
    if (store.playCommand == null) return
    const video = videoRef.current
    if (video) {
      if (store.playCommand === 'pause') {
        video.pause()
      } else if (video.paused) {
        void video.play().catch(() => {})
      } else {
        video.pause()
      }
    }
    store.clearPlayCommand()
  }, [store.playCommand])

  if (!store.media) return null

  return (
    <div className="flex-1 relative min-h-0 overflow-hidden bg-black">
      <video
        key={src}
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={() => store.togglePlay()}
        onTimeUpdate={(e) => {
          store.setCurrentTime(e.currentTarget.currentTime)
        }}
        onLoadedMetadata={(e) => {
          store.setCurrentTime(e.currentTarget.currentTime)
        }}
        onPlay={() => store.setPlaying(true)}
        onPause={() => store.setPlaying(false)}
        onEnded={() => store.setPlaying(false)}
      />
      {!store.media.hasVideo && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Music className={`w-12 h-12 ${tw.gray.text400}`} strokeWidth={1.5} />
          <p className={`text-sm mt-3 ${tw.text.secondary}`}>
            {store.media.fileName}
          </p>
        </div>
      )}
    </div>
  )
})
