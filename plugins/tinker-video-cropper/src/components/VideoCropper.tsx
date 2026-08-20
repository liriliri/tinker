import { observer } from 'mobx-react-lite'
import {
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import { createPlayer } from '@videojs/react'
import { Video, videoFeatures } from '@videojs/react/video'
import VideoPlayer from 'share/components/VideoPlayer'
import store from '../store'
import { createPlaceholderSrc } from '../lib/util'

interface VideoCropperProps {
  cropperRef: RefObject<CropperRef | null>
}

const { Provider, Container } = createPlayer({
  features: videoFeatures,
})

function applyStoredCrop(cropper: CropperRef) {
  if (store.cropBoxWidth <= 0 || store.cropBoxHeight <= 0) return
  cropper.setCoordinates({
    left: store.cropX,
    top: store.cropY,
    width: store.cropBoxWidth,
    height: store.cropBoxHeight,
  })
}

function ensureCropMount(skin: HTMLElement): HTMLElement {
  const existing = skin.querySelector(
    '.video-cropper-mount'
  ) as HTMLElement | null
  if (existing) return existing

  const mount = document.createElement('div')
  mount.className = 'video-cropper-mount'
  const controls = skin.querySelector('.media-controls')
  if (controls) {
    skin.insertBefore(mount, controls)
  } else {
    skin.appendChild(mount)
  }
  return mount
}

export default observer(function VideoCropper({
  cropperRef,
}: VideoCropperProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [cropMount, setCropMount] = useState<HTMLElement | null>(null)
  const placeholderSrc = useMemo(() => {
    if (!store.video) return ''
    return createPlaceholderSrc(store.video.width, store.video.height)
  }, [store.video?.width, store.video?.height, store.video?.filePath])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap || !store.video) {
      setCropMount(null)
      return
    }

    const syncMount = () => {
      const skin = wrap.querySelector(
        '.media-default-skin'
      ) as HTMLElement | null
      if (!skin) return
      setCropMount(ensureCropMount(skin))
    }

    syncMount()
    const mo = new MutationObserver(syncMount)
    mo.observe(wrap, { childList: true, subtree: true })
    return () => {
      mo.disconnect()
      const mount = wrap.querySelector('.video-cropper-mount')
      mount?.remove()
      setCropMount(null)
    }
  }, [store.video?.src])

  useEffect(() => {
    if (!cropperRef.current) return
    applyStoredCrop(cropperRef.current)
  }, [cropperRef, store.cropSyncToken])

  if (!store.video) return null

  const canEdit = !store.isExporting
  let cropOverlay: ReactNode = null
  if (cropMount && placeholderSrc) {
    cropOverlay = createPortal(
      <Cropper
        ref={cropperRef}
        src={placeholderSrc}
        className={`h-full w-full video-cropper-stencil${
          canEdit ? '' : ' video-cropper-stencil--disabled'
        }`}
        backgroundClassName="bg-transparent"
        stencilProps={{
          aspectRatio: store.aspectRatio ?? undefined,
          movable: canEdit,
          resizable: canEdit,
          handlers: canEdit,
          lines: canEdit,
        }}
        onReady={applyStoredCrop}
        onChange={(cropper) => {
          if (!canEdit) return
          const coordinates = cropper.getCoordinates()
          if (!coordinates) return
          store.setCropBox({
            x: coordinates.left,
            y: coordinates.top,
            width: coordinates.width,
            height: coordinates.height,
          })
        }}
      />,
      cropMount
    )
  }

  return (
    <div
      ref={wrapRef}
      className="video-cropper-root flex-1 relative min-h-0 overflow-hidden"
    >
      <Provider>
        <Container className="h-full">
          <VideoPlayer disabled={!canEdit}>
            <Video src={store.video.src} autoPlay={canEdit} />
          </VideoPlayer>
        </Container>
      </Provider>
      {cropOverlay}
    </div>
  )
})
