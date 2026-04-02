import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ScanningView() {
  const { t } = useTranslation()

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2
        className={`w-8 h-8 animate-spin ${tw.primary.text}`}
        strokeWidth={1.5}
      />
      <div className="text-center">
        <p className={`text-sm ${tw.text.primary}`}>{t('scanning')}</p>
        <p
          className={`text-xs mt-1 ${tw.text.secondary} max-w-xs break-all`}
          title={store.scanPath}
        >
          {store.scanPath}
        </p>
        {store.scanProgress && (
          <p className={`text-xs mt-2 ${tw.text.tertiary}`}>
            {t('items')}: {store.scanProgress.items.toLocaleString()}
            {store.scanProgress.errors > 0 && (
              <span className="ml-3 text-red-500">
                {t('errors')}: {store.scanProgress.errors}
              </span>
            )}
          </p>
        )}
      </div>
      <button
        onClick={() => store.cancelScan()}
        className={`flex items-center px-3 py-1 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.secondary}`}
      >
        {t('cancel')}
      </button>
    </div>
  )
})
