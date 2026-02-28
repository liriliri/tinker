import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import className from 'licia/className'
import { tw } from 'share/theme'
import { LoadingCircle } from 'share/components/Loading'
import store from '../store'
import { getCheckboardStyle } from '../lib/checkboard'
import { MenuItemConstructorOptions } from 'electron'

export default observer(function ImageList() {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault()
    const image = store.images.find((img) => img.id === imageId)
    if (!image) return

    const menuItems: MenuItemConstructorOptions[] = []

    if (!image.compressedBlob && !image.isCompressing) {
      menuItems.push({
        label: t('compress'),
        click: () => store.compressImage(imageId),
      })
    }

    if (image.compressedUrl) {
      menuItems.push({
        label: t('compareImages'),
        click: () => store.setCompareImageId(imageId),
      })
    }

    if (image.compressedBlob) {
      menuItems.push({
        label: t('copy'),
        click: () => store.copyCompressedImage(imageId),
      })
    }

    menuItems.push({
      label: t('remove'),
      click: () => store.removeImage(imageId),
    })

    tinker.showContextMenu(e.clientX, e.clientY, menuItems)
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        }}
      >
        {store.images.map((image) => {
          const ratio = (1 - image.compressedSize / image.originalSize) * 100
          const isLarger = image.compressedSize >= image.originalSize
          return (
            <div
              key={image.id}
              className={`${tw.bg.tertiary} rounded-lg border ${tw.border} overflow-hidden relative group flex flex-col ${tw.primary.hoverBorder} transition-all duration-100`}
              style={{ aspectRatio: '1 / 1' }}
              onContextMenu={(e) => handleContextMenu(e, image.id)}
            >
              <div
                className="flex-1 flex items-center justify-center p-2 relative overflow-hidden"
                style={getCheckboardStyle(store.isDark)}
              >
                <img
                  src={image.compressedUrl || image.originalImage.src}
                  alt={image.fileName}
                  className="max-w-full max-h-full object-contain"
                />
                {image.isCompressing && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <LoadingCircle className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className={`p-2 ${tw.bg.secondary} flex-shrink-0`}>
                <p
                  className={`text-xs font-medium ${tw.text.primary} truncate mb-1`}
                  title={image.fileName}
                >
                  {image.fileName}
                </p>
                <div className={`text-[10px] ${tw.gray.text400}`}>
                  {image.compressedBlob ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="line-through">
                          {fileSize(image.originalSize)}
                        </span>
                        <span className="text-gray-400 dark:text-gray-600">
                          →
                        </span>
                        <span className={`font-medium ${tw.text.primary}`}>
                          {fileSize(image.compressedSize)}
                        </span>
                      </div>
                      <span
                        className={className('font-medium', {
                          'text-red-600 dark:text-red-400': isLarger,
                          'text-green-600 dark:text-green-400': !isLarger,
                        })}
                      >
                        {isLarger ? '+' : ''}
                        {Math.abs(ratio).toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-left">
                      {fileSize(image.originalSize)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})
