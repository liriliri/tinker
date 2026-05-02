import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function StatusBar() {
  const { t } = useTranslation()

  const isActive = store.scanning || store.cleaning
  const progress =
    store.scanProgress.total > 0
      ? (store.scanProgress.current / store.scanProgress.total) * 100
      : 0

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-t ${tw.border} ${tw.bg.secondary}`}
    >
      <div className="flex-1 flex items-center gap-3">
        {isActive && (
          <div
            className={`flex-1 h-1.5 rounded-full overflow-hidden ${tw.bg.tertiary}`}
          >
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <span className={`text-xs ${tw.text.secondary} whitespace-nowrap`}>
          {store.scanning
            ? t('scanProgress', {
                current: store.scanProgress.current,
                total: store.scanProgress.total,
              })
            : store.cleaning
            ? t('cleaning')
            : store.totalScannedSize > 0
            ? t('totalSize', { size: fileSize(store.totalScannedSize) })
            : t('ready')}
        </span>
      </div>
    </div>
  )
})
