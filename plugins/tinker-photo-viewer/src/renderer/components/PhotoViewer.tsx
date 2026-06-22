import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import PhotoViewer from 'share/components/PhotoViewer'
import { getPhotoPreview, prefetchPhotoPreview } from '../lib/preview'
import { getPhotoThumbnail } from '../lib/thumbnail'
import store from '../store'
import PhotoInfoPanel from './PhotoInfoPanel'

const PhotoViewerApp = observer(function PhotoViewerApp() {
  const { t } = useTranslation()

  const getThumbnailUrl = useCallback(
    (photo: { path: string }) =>
      getPhotoThumbnail(photo.path).then((result) => result?.url ?? null),
    []
  )

  const getPreviewUrl = useCallback(
    (photo: { path: string }) =>
      getPhotoPreview(photo.path).then((result) => result?.url ?? null),
    []
  )

  const prefetchPreview = useCallback((photo: { path: string }) => {
    prefetchPhotoPreview(photo.path)
  }, [])

  return (
    <PhotoViewer
      open={store.viewerOpen}
      items={store.photos}
      currentIndex={store.viewerIndex}
      onClose={() => store.closeViewer()}
      onIndexChange={(index) => store.setViewerIndex(index)}
      labels={{
        closeViewer: t('closeViewer'),
        prevPhoto: t('prevPhoto'),
        nextPhoto: t('nextPhoto'),
        previewLoadFailed: t('previewLoadFailed'),
      }}
      getThumbnailUrl={getThumbnailUrl}
      getPreviewUrl={getPreviewUrl}
      prefetchPreview={prefetchPreview}
      renderSidebar={(photo) => <PhotoInfoPanel photo={photo} />}
    />
  )
})

export default PhotoViewerApp
