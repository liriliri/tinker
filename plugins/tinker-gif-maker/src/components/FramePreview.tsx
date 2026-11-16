import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import ImageOpen from 'share/components/ImageOpen'
import { LoadingCircle } from 'share/components/Loading'
import { openImageFile } from 'share/lib/util'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function FramePreview() {
  const { t } = useTranslation()
  const frame = store.currentFrame

  if (!frame) {
    return (
      <div className={`flex-1 min-h-0 flex flex-col ${tw.bg.primary}`}>
        <ImageOpen
          onOpenImage={async () => {
            const result = await openImageFile({
              title: t('openGif'),
              extensions: ['gif'],
            })
            if (!result) return
            try {
              await store.openFromFile(result.file, result.filePath)
            } catch {
              toast.error(t('openFailed'))
            }
          }}
          openTitle={t('openTitle')}
          supportedFormats=""
        />
      </div>
    )
  }

  return (
    <div
      className={`relative flex-1 min-h-0 flex items-center justify-center p-4 overflow-hidden ${tw.bg.secondary}`}
    >
      <img
        src={frame.url}
        alt={t('frameAlt', { index: store.selectedIndex + 1 })}
        className={`max-w-full max-h-full object-contain shadow-md ${tw.bg.primary}`}
        draggable={false}
      />
      {store.exporting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <LoadingCircle />
        </div>
      )}
    </div>
  )
})
