import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import { tw, THEME_COLORS } from 'share/theme'
import store from '../store'
import { MenuItemConstructorOptions } from 'electron'

export default observer(function ImageList() {
  const { t } = useTranslation()
  const checkColors = store.isDark
    ? THEME_COLORS.checkboard.dark
    : THEME_COLORS.checkboard.light

  const handleContextMenu = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault()
    const image = store.images.find((img) => img.id === imageId)
    if (!image) return

    const menuItems: MenuItemConstructorOptions[] = []

    // Show compress option if image hasn't been compressed yet
    if (!image.compressedBlob && !image.isCompressing) {
      menuItems.push({
        label: t('compress'),
        click: () => store.compressImage(imageId),
      })
    }

    // Only show compare option if image has been compressed
    if (image.compressedDataUrl) {
      menuItems.push({
        label: t('compareImages'),
        click: () => store.setCompareImageId(imageId),
      })
    }

    // Only show copy option if image has been compressed
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
        {store.images.map((image) => (
          <div
            key={image.id}
            className={`${tw.bg.both.tertiary} rounded-lg border ${tw.border.both} overflow-hidden relative group flex flex-col ${tw.primary.hoverBorder} transition-all duration-100`}
            style={{ aspectRatio: '1 / 1' }}
            onContextMenu={(e) => handleContextMenu(e, image.id)}
          >
            {/* Image preview - rectangular container */}
            <div
              className="flex-1 flex items-center justify-center p-2 relative overflow-hidden"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, ${checkColors.dark} 25%, transparent 25%),
                  linear-gradient(-45deg, ${checkColors.dark} 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, ${checkColors.dark} 75%),
                  linear-gradient(-45deg, transparent 75%, ${checkColors.dark} 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: checkColors.light,
              }}
            >
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
            <div className={`p-2 ${tw.bg.both.secondary} flex-shrink-0`}>
              <p
                className={`text-xs font-medium ${tw.text.both.primary} truncate mb-1`}
                title={image.fileName}
              >
                {image.fileName}
              </p>
              <div
                className={`text-[10px] ${tw.gray.light.text500} ${tw.gray.light.text400}`}
              >
                {image.compressedBlob ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="line-through">
                        {fileSize(image.originalSize)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">
                        →
                      </span>
                      <span className={`font-medium ${tw.text.both.primary}`}>
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
