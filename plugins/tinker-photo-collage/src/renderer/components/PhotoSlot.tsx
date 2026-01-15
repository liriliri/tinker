import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

interface PhotoSlotProps {
  areaName: string
}

const PhotoSlot = observer(({ areaName }: PhotoSlotProps) => {
  const slot = store.photoSlots.find(s => s.areaName === areaName)
  const photo = slot?.photoId ? store.photos.find(p => p.id === slot.photoId) : null

  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        store.addPhotos([files[0]])
        const newPhoto = store.photos[store.photos.length - 1]
        store.setPhotoToSlot(areaName, newPhoto.id)
      }
    }
    input.click()
  }

  const borderRadiusStyle = store.radiusEnabled ? `${store.radius}px` : '0px'

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${tw.bg.both.primary} flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
      style={{
        gridArea: areaName,
        borderRadius: borderRadiusStyle
      }}
      onClick={handleClick}
    >
      {photo ? (
        <img
          src={photo.url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <Plus size={48} className={tw.text.both.secondary} />
      )}
    </div>
  )
})

export default PhotoSlot
