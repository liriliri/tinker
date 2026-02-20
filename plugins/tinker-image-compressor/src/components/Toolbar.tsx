import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, ListX, Info } from 'lucide-react'
import { useState } from 'react'
import fileSize from 'licia/fileSize'
import className from 'licia/className'
import Select from 'share/components/Select'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
  ToolbarTextButton,
  ToolbarLabel,
} from 'share/components/Toolbar'
import store from '../store'

const QUALITY_LEVELS = [
  { label: 'qualityVeryLow', value: 20 },
  { label: 'qualityLow', value: 40 },
  { label: 'qualityMedium', value: 60 },
  { label: 'qualityHigh', value: 80 },
  { label: 'qualityExcellent', value: 95 },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()
  const [showStats, setShowStats] = useState(false)

  const handleQualityChange = (value: number) => {
    store.setQuality(value)
  }

  const qualityOptions = QUALITY_LEVELS.map((level) => ({
    label: t(level.label),
    value: level.value,
  }))

  const handleOverwriteChange = (checked: boolean) => {
    store.setOverwriteOriginal(checked)
  }

  const handleCompress = async () => {
    await store.compressAll()
  }

  const handleOpenImage = async () => {
    await store.openImageDialog()
  }

  const handleSaveImage = async () => {
    await store.saveAll()
  }

  const handleClear = () => {
    store.clear()
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleOpenImage} title={t('openImage')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleClear}
        disabled={!store.hasImages}
        title={t('clear')}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleSaveImage}
        disabled={!store.hasUnsaved}
        title={t('saveImage')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <Checkbox
        checked={store.overwriteOriginal}
        onChange={handleOverwriteChange}
      >
        {t('overwriteOriginal')}
      </Checkbox>

      <ToolbarSpacer />

      {store.hasImages && (
        <>
          {/* Statistics Info */}
          <div className="relative">
            <ToolbarButton
              onMouseEnter={() => setShowStats(true)}
              onMouseLeave={() => setShowStats(false)}
              title={t('statistics')}
            >
              <Info size={TOOLBAR_ICON_SIZE} />
            </ToolbarButton>

            {/* Statistics Tooltip */}
            {showStats && (
              <div
                className={`absolute right-0 top-full mt-2 ${tw.bg.tertiary} border ${tw.border} dark:border-[#3e3e42] rounded shadow-lg p-3 text-xs z-50 whitespace-nowrap`}
              >
                <div className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                  {t('statistics')}
                </div>
                <div className="space-y-1.5 text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between gap-4">
                    <span>{t('totalImages')}:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {store.images.length}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>{t('totalOriginalSize')}:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {fileSize(store.totalOriginalSize)}
                    </span>
                  </div>
                  {store.hasCompressed && (
                    <>
                      <div className="flex justify-between gap-4">
                        <span>{t('totalCompressedSize')}:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {fileSize(store.totalCompressedSize)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>{t('totalReduction')}:</span>
                        <span
                          className={className('font-medium', {
                            'text-red-600 dark:text-red-400':
                              store.totalCompressedSize >=
                              store.totalOriginalSize,
                            'text-green-600 dark:text-green-400':
                              store.totalCompressedSize <
                              store.totalOriginalSize,
                          })}
                        >
                          {store.totalCompressedSize >= store.totalOriginalSize
                            ? '+'
                            : ''}
                          {store.totalCompressionRatio}%
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <ToolbarSeparator />

          {/* Quality Select */}
          <div className="flex gap-2 items-center">
            <ToolbarLabel>{`${t('quality')}:`}</ToolbarLabel>
            <Select
              value={store.quality}
              onChange={handleQualityChange}
              options={qualityOptions}
              disabled={store.isCompressing}
            />
          </div>

          <ToolbarSeparator />

          {/* Compress Button */}
          <ToolbarTextButton
            onClick={handleCompress}
            disabled={store.isCompressing || !store.hasUncompressed}
          >
            {t('compress')}
          </ToolbarTextButton>
        </>
      )}
    </Toolbar>
  )
})
