import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Save, ListX, Info } from 'lucide-react'
import { useState } from 'react'
import fileSize from 'licia/fileSize'
import Select from 'share/components/Select'
import store from '../store'

const QUALITY_LEVELS = [
  { label: 'qualityVeryLow', value: 20 },
  { label: 'qualityLow', value: 40 },
  { label: 'qualityMedium', value: 60 },
  { label: 'qualityHigh', value: 80 },
  { label: 'qualityExcellent', value: 95 },
]

const Toolbar = observer(() => {
  const { t } = useTranslation()
  const iconSize = 14
  const [showStats, setShowStats] = useState(false)

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`

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
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
      <button
        onClick={handleOpenImage}
        className={actionButtonClass}
        title={t('openImage')}
      >
        <FolderOpen size={iconSize} />
      </button>

      <button
        onClick={handleClear}
        disabled={!store.hasImages}
        className={actionButtonClass}
        title={t('clear')}
      >
        <ListX size={iconSize} />
      </button>

      <div className="h-5 w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={handleSaveImage}
        disabled={!store.hasUnsaved}
        className={actionButtonClass}
        title={t('saveImage')}
      >
        <Save size={iconSize} />
      </button>

      <label className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80">
        <input
          type="checkbox"
          checked={store.overwriteOriginal}
          onChange={handleOverwriteChange}
          className="cursor-pointer accent-[#0fc25e]"
        />
        <span>{t('overwriteOriginal')}</span>
      </label>

      <div className="flex-1" />

      {/* Statistics Info */}
      <div className="relative">
        <button
          onMouseEnter={() => setShowStats(true)}
          onMouseLeave={() => setShowStats(false)}
          className={actionButtonClass}
          title={t('statistics')}
          disabled={!store.hasImages}
        >
          <Info size={iconSize} />
        </button>

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

      <div className="h-5 w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-2" />

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

      <div className="h-5 w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-2" />

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
    </div>
  )
})

export default Toolbar
