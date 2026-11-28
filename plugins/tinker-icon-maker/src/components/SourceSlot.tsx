import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ImagePlus, X } from 'lucide-react'
import { tw } from 'share/theme'
import { useImageDrop } from '../hooks/useImageDrop'
import store from '../store'

const SourceSlot = observer(function SourceSlot() {
  const { t } = useTranslation()
  const source = store.source
  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } =
    useImageDrop((file) => {
      void store.loadDroppedFile(file)
    })

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative h-40 overflow-hidden rounded border ${
        isDragOver
          ? `${tw.primary.border} ${tw.bg.secondary}`
          : `${tw.border} ${tw.bg.primary}`
      }`}
    >
      {source ? (
        <>
          <button
            type="button"
            onClick={() => void store.openImageDialog()}
            className="absolute inset-0 h-full w-full"
            title={source.fileName}
          >
            <img
              src={source.url}
              alt={source.fileName}
              className="h-full w-full object-contain"
              draggable={false}
            />
          </button>
          <button
            type="button"
            onClick={() => store.clearSource()}
            title={t('clear')}
            className={`absolute top-1.5 right-1.5 z-10 rounded p-1 ${tw.bg.secondary} ${tw.hover} ${tw.text.tertiary}`}
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => void store.openImageDialog()}
          className={`flex h-full w-full flex-col items-center justify-center gap-2 border-0 bg-transparent ${tw.hover}`}
        >
          <ImagePlus size={24} className={tw.text.tertiary} strokeWidth={1.5} />
          <span className={`text-xs ${tw.text.tertiary}`}>
            {t('dropImageHint')}
          </span>
        </button>
      )}
    </div>
  )
})

export default SourceSlot
