import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

export default observer(function UIComponentsTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('buttons')}
        </h2>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-[#0fc25e] text-white rounded hover:bg-[#0db054] transition-colors">
            {t('primaryButton')}
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
            {t('secondaryButton')}
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            {t('successButton')}
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
            {t('dangerButton')}
          </button>
          <button className="px-4 py-2 border-2 border-[#0fc25e] text-[#0fc25e] rounded hover:bg-[#0fc25e]/10 dark:hover:bg-[#3a3a3c] transition-colors">
            {t('outlineButton')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('cards')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#f0f1f2] dark:bg-[#303133] rounded-lg shadow p-4 border border-[#e0e0e0] dark:border-[#4a4a4a]">
            <h3 className="font-semibold text-gray-900 dark:text-[#d4d4d4] mb-2">
              {t('cardTitle1')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('cardContent1')}
            </p>
          </div>
          <div className="bg-[#f0f1f2] dark:bg-[#303133] rounded-lg shadow p-4 border border-[#e0e0e0] dark:border-[#4a4a4a]">
            <h3 className="font-semibold text-gray-900 dark:text-[#d4d4d4] mb-2">
              {t('cardTitle2')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('cardContent2')}
            </p>
          </div>
          <div className="bg-[#f0f1f2] dark:bg-[#303133] rounded-lg shadow p-4 border border-[#e0e0e0] dark:border-[#4a4a4a]">
            <h3 className="font-semibold text-gray-900 dark:text-[#d4d4d4] mb-2">
              {t('cardTitle3')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('cardContent3')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('formInputs')}
        </h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('textInput')}
            </label>
            <input
              type="text"
              placeholder={t('textInputPlaceholder')}
              className="w-full px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#303133] text-gray-900 dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#0fc25e]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('textarea')}
            </label>
            <textarea
              rows={3}
              placeholder={t('textareaPlaceholder')}
              className="w-full px-3 py-2 border border-[#e0e0e0] dark:border-[#4a4a4a] rounded bg-white dark:bg-[#303133] text-gray-900 dark:text-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#0fc25e]"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#0fc25e] rounded focus:ring-2 focus:ring-[#0fc25e]"
              />
              <span className="text-sm">{t('checkboxOption')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
})
