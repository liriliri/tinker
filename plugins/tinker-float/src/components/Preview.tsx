import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function Preview() {
  const { t } = useTranslation()

  if (!store.hasContent) {
    return (
      <div
        className={`flex-1 flex items-center justify-center ${tw.text.secondary}`}
      >
        <p className="text-sm">{t('noContent')}</p>
      </div>
    )
  }

  if (store.contentType === 'image') {
    return (
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <img
          src={store.imageDataUrl}
          className="max-w-full max-h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget
            if (
              img.naturalWidth !== store.imageNaturalWidth ||
              img.naturalHeight !== store.imageNaturalHeight
            ) {
              store.setImageNaturalSize(img.naturalWidth, img.naturalHeight)
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className={`flex-1 overflow-auto p-4 ${tw.text.primary}`}>
      <pre className="whitespace-pre-wrap break-words text-sm font-sans">
        {store.textContent}
      </pre>
    </div>
  )
})
