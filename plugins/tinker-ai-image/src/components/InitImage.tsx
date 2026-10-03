import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileUrl from 'licia/fileUrl'
import { ImagePlus, X } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function InitImage() {
  const { t } = useTranslation()
  const path = store.initImagePath

  return (
    <div
      className={`relative rounded border ${tw.border} ${tw.bg.primary} overflow-hidden aspect-video`}
    >
      {path ? (
        <>
          <button
            type="button"
            onClick={() => void store.chooseInitImage()}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={fileUrl(path)}
              alt={t('initImage')}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </button>
          <button
            type="button"
            onClick={() => store.clearInitImage()}
            title={t('clearInitImage')}
            className={`absolute top-1.5 right-1.5 z-10 p-1 rounded ${tw.bg.secondary} ${tw.hover} ${tw.text.tertiary}`}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void store.chooseInitImage()}
          className={`w-full h-full ${tw.hover} flex flex-col items-center justify-center gap-2 border-0 bg-transparent`}
        >
          <ImagePlus size={24} className={tw.text.tertiary} strokeWidth={1.5} />
          <span className={`text-xs ${tw.text.tertiary}`}>
            {t('dropInitHint')}
          </span>
        </button>
      )}
    </div>
  )
})
