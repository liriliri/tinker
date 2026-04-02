import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { LoadingCircle } from 'share/components/Loading'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ScanningView() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <LoadingCircle className="w-8 h-8" />
      <div className="text-center">
        <p className={`text-sm ${tw.text.primary}`}>{t('scanning')}</p>
        <p
          className={`text-xs mt-1 ${tw.text.secondary} truncate max-w-sm`}
          title={store.scanPath}
        >
          {store.scanPath}
        </p>
        <div
          className={`text-xs mt-3 tabular-nums ${tw.text.tertiary} h-10 flex flex-col justify-center`}
        >
          {store.scanProgress && (
            <p>
              {store.scanProgress.count.toLocaleString()}
              {store.scanProgress.size > 0 && (
                <> · {fileSize(store.scanProgress.size)}</>
              )}
              {store.scanProgress.errors > 0 && (
                <span className="text-red-500">
                  {' '}
                  · {t('errors')}: {store.scanProgress.errors}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => store.cancelScan()}
        className={`flex items-center px-4 py-1.5 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.secondary}`}
      >
        {t('cancel')}
      </button>
    </div>
  )
})
