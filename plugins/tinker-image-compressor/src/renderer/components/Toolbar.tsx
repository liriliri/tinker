import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, ListX, Info } from 'lucide-react'
import { useState } from 'react'
import fileSize from 'licia/fileSize'
import Select from 'share/components/Select'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import store from '../store'

const QUALITY_LEVELS = [
  { label: 'qualityVeryLow', value: 20 },
  { label: 'qualityLow', value: 40 },
  { label: 'qualityMedium', value: 60 },
  { label: 'qualityHigh', value: 80 },
  { label: 'qualityExcellent', value: 95 },
]

const ToolbarComponent = observer(() => {
  const { t } = useTranslation()
  const [showStats, setShowStats] = useState(false)

  const handleQualityChange = (value: number) => {
    store.setQuality(value)
  }

  const qualityOptions = QUALITY_LEVELS.map((level) => ({
    label: t(level.label),
    value: level.value,
  }))

  const handleOverwriteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setOverwriteOriginal(e.target.checked)
  }

  const handleCompress = async () => {
    await store.compressAll()
  }

  const handleOpenImage = async () => {
    try {
      await store.openImageDialog()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  const handleSaveImage = async () => {
    try {
      await store.saveAll()
    } catch (err) {
      console.error('Failed to save images:', err)
    }
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

      <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80">
        <input
          type="checkbox"
          checked={store.overwriteOriginal}
          onChange={handleOverwriteChange}
          className="cursor-pointer accent-[#0fc25e]"
        />
        <span>{t('overwriteOriginal')}</span>
      </label>

      <ToolbarSpacer />

      {/* Statistics Info */}
      <div className="relative">
        <ToolbarButton
          onMouseEnter={() => setShowStats(true)}
          onMouseLeave={() => setShowStats(false)}
          title={t('statistics')}
          disabled={!store.hasImages}
        >
          <Info size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>

        {/* Statistics Tooltip */}
        {showStats && store.hasImages && (
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-[#252526] border border-[#e0e0e0] dark:border-[#3e3e42] rounded shadow-lg p-3 text-xs z-50 whitespace-nowrap">
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
                      className={`font-medium ${
                        store.totalCompressedSize >= store.totalOriginalSize
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
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
        <label className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
          {t('quality')}:
        </label>
        <Select
          value={store.quality}
          onChange={handleQualityChange}
          options={qualityOptions}
          disabled={store.isCompressing}
        />
      </div>

      <ToolbarSeparator />

      {/* Compress Button */}
      <button
        onClick={handleCompress}
        disabled={
          !store.hasImages || store.isCompressing || !store.hasUncompressed
        }
        className="px-3 py-1 text-xs bg-[#0fc25e] hover:bg-[#0da84f] disabled:bg-[#8a8a8a] disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
      >
        {store.isCompressing ? t('compressing') : t('compress')}
      </button>
    </Toolbar>
  )
})

export default ToolbarComponent
