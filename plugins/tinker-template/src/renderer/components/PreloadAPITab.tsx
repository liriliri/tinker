import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function PreloadAPITab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('systemInformation')}
        </h2>
        <button
          onClick={() => store.getSystemInfo()}
          className="px-4 py-2 bg-[#0fc25e] text-white rounded hover:bg-[#0db054] mb-4"
        >
          {t('getSystemInfo')}
        </button>
        {store.systemInfo && (
          <div className="bg-[#f0f1f2] dark:bg-[#303133] rounded p-4 space-y-2 font-mono text-sm border border-[#e0e0e0] dark:border-[#4a4a4a]">
            <div className="text-gray-900 dark:text-[#d4d4d4]">
              <span className="text-gray-600 dark:text-gray-400">
                {t('platform')}:
              </span>{' '}
              {store.systemInfo.platform}
            </div>
            <div className="text-gray-900 dark:text-[#d4d4d4]">
              <span className="text-gray-600 dark:text-gray-400">
                {t('architecture')}:
              </span>{' '}
              {store.systemInfo.arch}
            </div>
            <div className="text-gray-900 dark:text-[#d4d4d4]">
              <span className="text-gray-600 dark:text-gray-400">
                {t('nodeVersion')}:
              </span>{' '}
              {store.systemInfo.nodeVersion}
            </div>
            <div className="text-gray-900 dark:text-[#d4d4d4] break-all">
              <span className="text-gray-600 dark:text-gray-400">
                {t('homeDirectory')}:
              </span>{' '}
              {store.systemInfo.homeDir}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1e1e1e] rounded-lg p-6 border border-[#e0e0e0] dark:border-[#4a4a4a]">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-[#d4d4d4]">
          {t('currentTime')}
        </h2>
        <button
          onClick={() => store.getCurrentTime()}
          className="px-4 py-2 bg-[#0fc25e] text-white rounded hover:bg-[#0db054] mb-4"
        >
          {t('getCurrentTime')}
        </button>
        {store.currentTime && (
          <div className="bg-[#f0f1f2] dark:bg-[#303133] rounded p-4 border border-[#e0e0e0] dark:border-[#4a4a4a]">
            <p className="text-2xl font-mono text-gray-900 dark:text-[#d4d4d4]">
              {store.currentTime}
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#0fc25e]/10 dark:bg-[#0fc25e]/20 rounded-lg p-6 border border-[#0fc25e]/30">
        <h3 className="font-semibold text-[#0db054] dark:text-[#0fc25e] mb-2">
          {t('availablePreloadAPIs')}
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <li>{t('getSystemInfoAPI')}</li>
          <li>{t('getCurrentTimeAPI')}</li>
          <li>{t('getGreetingAPI')}</li>
          <li>{t('readFileAPI')}</li>
          <li>{t('writeFileAPI')}</li>
          <li>{t('getAppDataPathAPI')}</li>
        </ul>
      </div>
    </div>
  )
})
