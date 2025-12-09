import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import fileSize from 'licia/fileSize'
import store from '../store'

const ImageList = observer(() => {
  const { t } = useTranslation()

  return (
    <div className="flex-1 overflow-auto p-4">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        }}
      >
        {store.images.map((image) => (
          <div
            key={image.id}
            className="bg-white dark:bg-[#252526] rounded-lg border border-[#e0e0e0] dark:border-[#3e3e42] overflow-hidden relative group flex flex-col"
            style={{ aspectRatio: '1 / 1' }}
          >
            {/* Remove button */}
            <button
              onClick={() => store.removeImage(image.id)}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title={t('remove')}
            >
              <X size={14} />
            </button>

            {/* Image preview - rectangular container */}
            <div className="flex-1 bg-[repeating-conic-gradient(#f0f0f0_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#2d2d30_0%_25%,#252526_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-2 relative overflow-hidden">
              <img
                src={image.compressedDataUrl || image.originalImage.src}
                alt={image.fileName}
                className="max-w-full max-h-full object-contain"
              />
              {image.isCompressing && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Info - fixed height */}
            <div className="p-2 bg-[#f3f3f3] dark:bg-[#2d2d30] flex-shrink-0">
              <p
                className="text-xs font-medium text-[#333] dark:text-[#cccccc] truncate mb-1"
                title={image.fileName}
              >
                {image.fileName}
              </p>
              <div className="text-[10px] text-[#6e6e6e] dark:text-[#8a8a8a]">
                {image.compressedBlob ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="line-through">
                        {fileSize(image.originalSize)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">
                        →
                      </span>
                      <span className="font-medium text-[#333] dark:text-[#cccccc]">
                        {fileSize(image.compressedSize)}
                      </span>
                    </div>
                    {(() => {
                      const ratio =
                        (1 - image.compressedSize / image.originalSize) * 100
                      const isLarger =
                        image.compressedSize >= image.originalSize
                      return (
                        <span
                          className={`font-medium ${
                            isLarger
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {isLarger ? '+' : ''}
                          {Math.abs(ratio).toFixed(1)}%
                        </span>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="text-left">
                    {fileSize(image.originalSize)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default ImageList
