import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { ImagePlus, X } from 'lucide-react'
import { tw } from 'share/theme'
import { firstDroppedImage } from '../lib/util'
import store from '../store'

const SourceSlot = observer(function SourceSlot() {
  const { t } = useTranslation()
  const [dropHighlight, setDropHighlight] = useState(false)
  const source = store.source

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    if (!dropHighlight) setDropHighlight(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropHighlight(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropHighlight(false)
    const file = firstDroppedImage(e.dataTransfer.files)
    if (!file) return
    await store.loadDroppedFile(file)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative h-40 overflow-hidden rounded border ${
        dropHighlight
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
