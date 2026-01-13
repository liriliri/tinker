import { observer } from 'mobx-react-lite'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import { RefObject } from 'react'
import { tw } from 'share/theme'
import store from '../store'

interface ImageCropperProps {
  cropperRef: RefObject<CropperRef | null>
}

export default observer(function ImageCropper({
  cropperRef,
}: ImageCropperProps) {
  if (!store.image) return null

  const handleChange = (cropper: CropperRef) => {
    const state = cropper.getState()
    const { width, height } = state?.coordinates || { width: 0, height: 0 }
    store.setCropBoxSize(width, height)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full h-full max-w-4xl max-h-full">
        <Cropper
          ref={cropperRef}
          src={store.image.originalUrl}
          className="h-full"
          backgroundClassName={`${tw.bg.both.secondary}`}
          stencilProps={{
            aspectRatio: store.aspectRatio ?? undefined,
          }}
          onChange={handleChange}
        />
      </div>
    </div>
  )
})
