import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { LoadingCircle } from 'share/components/Loading'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ScanningView() {
  const { t } = useTranslation()

  const progress =
    store.scanProgress.total > 0
      ? (store.scanProgress.current / store.scanProgress.total) * 100
      : 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5">
      <LoadingCircle className="w-8 h-8" />
      <div className="text-center">
        <p className={`text-sm ${tw.text.primary}`}>{t('scanning')}</p>
        <p
          className={`text-xs mt-1 ${tw.text.secondary} truncate max-w-sm`}
          title={store.currentScanPath}
        >
          {store.currentScanPath}
        </p>
        <p className={`text-xs mt-3 tabular-nums ${tw.text.tertiary}`}>
          {t('scanProgress', {
            current: store.scanProgress.current,
            total: store.scanProgress.total,
          })}
        </p>
      </div>
      <div
        className={`w-48 h-1.5 rounded-full overflow-hidden ${tw.bg.tertiary}`}
      >
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
})
