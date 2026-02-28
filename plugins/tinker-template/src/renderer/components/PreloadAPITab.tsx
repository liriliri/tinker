import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function PreloadAPITab() {
  const { t } = useTranslation()

  return (
    <div className="space-y-6">
      <div className={`${tw.bg.primary} rounded-lg p-6 border ${tw.border}`}>
        <h2 className={`text-xl font-semibold mb-4 ${tw.text.primary}`}>
          {t('systemInformation')}
        </h2>
        <button
          onClick={() => store.getSystemInfo()}
          className={`px-4 py-2 ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded mb-4`}
        >
          {t('getSystemInfo')}
        </button>
        {store.systemInfo && (
          <div
            className={`${tw.bg.secondary} rounded p-4 space-y-2 font-mono text-sm border ${tw.border}`}
          >
            <div className={tw.text.primary}>
              <span className={tw.text.secondary}>{t('platform')}:</span>{' '}
              {store.systemInfo.platform}
            </div>
            <div className={tw.text.primary}>
              <span className={tw.text.secondary}>{t('architecture')}:</span>{' '}
              {store.systemInfo.arch}
            </div>
            <div className={tw.text.primary}>
              <span className={tw.text.secondary}>{t('nodeVersion')}:</span>{' '}
              {store.systemInfo.nodeVersion}
            </div>
            <div className={`${tw.text.primary} break-all`}>
              <span className={tw.text.secondary}>{t('homeDirectory')}:</span>{' '}
              {store.systemInfo.homeDir}
            </div>
          </div>
        )}
      </div>

      <div className={`${tw.bg.primary} rounded-lg p-6 border ${tw.border}`}>
        <h2 className={`text-xl font-semibold mb-4 ${tw.text.primary}`}>
          {t('currentTime')}
        </h2>
        <button
          onClick={() => store.getCurrentTime()}
          className={`px-4 py-2 ${tw.primary.bg} ${tw.primary.bgHover} text-white rounded mb-4`}
        >
          {t('getCurrentTime')}
        </button>
        {store.currentTime && (
          <div className={`${tw.bg.secondary} rounded p-4 border ${tw.border}`}>
            <p className={`text-2xl font-mono ${tw.text.primary}`}>
              {store.currentTime}
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#0fc25e]/10 dark:bg-[#0fc25e]/20 rounded-lg p-6 border border-[#0fc25e]/30">
        <h3 className={`font-semibold ${tw.primary.text} mb-2`}>
          {t('availablePreloadAPIs')}
        </h3>
        <ul
          className={`list-disc list-inside space-y-1 text-sm ${tw.text.secondary}`}
        >
          <li>{t('getSystemInfoAPI')}</li>
          <li>{t('getCurrentTimeAPI')}</li>
          <li>{t('getGreetingAPI')}</li>
          <li>{t('getAppDataPathAPI')}</li>
        </ul>
      </div>
    </div>
  )
})
