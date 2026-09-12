import { observer } from 'mobx-react-lite'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import { RefObject, useEffect } from 'react'
import { tw } from 'share/theme'
import store from '../store'

interface ImageCropperProps {
  cropperRef: RefObject<CropperRef | null>
}

const NUDGE_STEP = 1

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

export default observer(function ImageCropper({
  cropperRef,
}: ImageCropperProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const cropper = cropperRef.current
      if (!cropper || isEditableTarget(e.target)) return

      let left = 0
      let top = 0

      switch (e.key) {
        case 'ArrowLeft':
          left = -NUDGE_STEP
          break
        case 'ArrowRight':
          left = NUDGE_STEP
          break
        case 'ArrowUp':
          top = -NUDGE_STEP
          break
        case 'ArrowDown':
          top = NUDGE_STEP
          break
        default:
          return
      }

      e.preventDefault()
      cropper.moveCoordinates({ left, top })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cropperRef])

  if (!store.image) return null

  const handleChange = (cropper: CropperRef) => {
    const state = cropper.getState()
    const { width, height } = state?.coordinates || { width: 0, height: 0 }
    store.setCropBoxSize(width, height)
  }

  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-w-4xl max-h-full">
        <Cropper
          ref={cropperRef}
          src={store.image.originalUrl}
          className="h-full"
          backgroundClassName={`${tw.bg.secondary}`}
          stencilProps={{
            aspectRatio: store.aspectRatio ?? undefined,
          }}
          onChange={handleChange}
        />
      </div>
    </div>
  )
})
