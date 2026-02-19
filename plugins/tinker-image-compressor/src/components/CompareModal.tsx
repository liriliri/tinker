import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ImgComparisonSlider } from '@img-comparison-slider/react'
import Dialog from 'share/components/Dialog'
import store from '../store'
import { getCheckboardStyle } from '../lib/checkboard'

export default observer(function CompareModal() {
  const { t } = useTranslation()

  const image = store.compareImageId
    ? store.images.find((img) => img.id === store.compareImageId)
    : null

  const handleClose = () => {
    store.setCompareImageId(null)
  }

  if (!image || !image.compressedDataUrl) {
    return null
  }

  return (
    <Dialog
      open={!!store.compareImageId}
      onClose={handleClose}
      title={`${t('compareImages')} - ${image.fileName}`}
      className="w-auto max-w-[90vw] min-w-[400px]"
      showClose={true}
    >
      <div className="flex justify-center items-center">
        <div
          style={{
            maxWidth: '100%',
            width: 'fit-content',
            ...getCheckboardStyle(store.isDark),
          }}
        >
          <ImgComparisonSlider style={{ outline: 'none' }}>
            <img
              slot="first"
              src={image.originalImage.src}
              alt={t('original')}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
            <img
              slot="second"
              src={image.compressedDataUrl}
              alt={t('compressed')}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          </ImgComparisonSlider>
        </div>
      </div>
    </Dialog>
  )
})
