import { observer } from 'mobx-react-lite'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import { RefObject } from 'react'
import store from '../store'

interface ImageCropperProps {
  cropperRef: RefObject<CropperRef>
}

const ImageCropper = observer(({ cropperRef }: ImageCropperProps) => {
  if (!store.image) return null

  return (
    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full h-full max-w-4xl max-h-full">
        <Cropper
          ref={cropperRef}
          src={store.image.originalUrl}
          className="h-full"
          backgroundClassName="bg-[#f0f1f2] dark:bg-[#303133]"
        />
      </div>
    </div>
  )
})

export default ImageCropper
