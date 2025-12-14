import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'

const ImageUpload = observer(() => {
  const { t } = useTranslation()

  const handleClick = async () => {
    try {
      await store.openImageDialog()
    } catch (err) {
      console.error('Failed to open image:', err)
    }
  }

  return (
    <div
      onClick={handleClick}
      className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#8a8a8a] dark:border-[#6e6e6e] rounded-lg cursor-pointer hover:border-[#0fc25e] dark:hover:border-[#0fc25e] transition-colors m-4"
    >
      <div className="text-center p-8 pointer-events-none">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-[#8a8a8a] dark:text-[#6e6e6e]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>

        <p className="text-lg font-medium text-[#333] dark:text-[#cccccc] mb-2">
          {t('uploadTitle')}
        </p>
        <p className="text-sm text-[#6e6e6e] dark:text-[#8a8a8a]">
          {t('supportedFormats')}
        </p>
      </div>
    </div>
  )
})

export default ImageUpload
