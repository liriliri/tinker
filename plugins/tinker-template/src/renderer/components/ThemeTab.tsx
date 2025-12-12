import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function ThemeTab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('currentTheme')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="px-6 py-3 bg-[#0fc25e] text-white rounded-lg font-medium">
            {store.isDark ? t('darkMode') : t('lightMode')}
          </div>
          <span className="text-gray-600 dark:text-gray-400">
            {t('themeControlledByTinker')}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('colorPalette')}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="w-full h-20 bg-[#0fc25e] rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('primary')}
            </p>
          </div>
          <div>
            <div className="w-full h-20 bg-gray-600 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('secondary')}
            </p>
          </div>
          <div>
            <div className="w-full h-20 bg-green-600 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('success')}
            </p>
          </div>
          <div>
            <div className="w-full h-20 bg-red-600 rounded mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('danger')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-900/40">
        <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
          {t('implementationNote')}
        </h3>
        <p className="text-sm text-yellow-800 dark:text-yellow-400 mb-3">
          {t('themeNote')}
        </p>
        <div className="text-sm text-yellow-800 dark:text-yellow-400">
          <p className="font-semibold mb-1">{t('howItWorks')}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              {t('getInitialTheme')}{' '}
              <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
                await tinker.getTheme()
              </code>
            </li>
            <li>
              {t('listenForChanges')}{' '}
              <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
                tinker.on('changeTheme', callback)
              </code>
            </li>
            <li>{t('applyDarkClass')}</li>
            <li>
              {t('useTailwindDark')}{' '}
              <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
                dark:
              </code>{' '}
              {t('modifierForStyling')}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
})
