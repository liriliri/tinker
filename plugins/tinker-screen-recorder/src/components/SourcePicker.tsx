import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'

interface SourcePickerProps {
  className?: string
}

export default observer(function SourcePicker({
  className = '',
}: SourcePickerProps) {
  const { t } = useTranslation()
  const disabled = store.recorderState !== 'idle'

  if (store.loadingSources || store.sources.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-sm ${tw.text.tertiary} ${className}`}
      >
        {t(store.loadingSources ? 'loadingSources' : 'noSources')}
      </div>
    )
  }

  return (
    <div className={`overflow-y-auto p-3 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        {store.sources.map((source) => {
          const selected = source.id === store.selectedId
          return (
            <button
              key={source.id}
              type="button"
              disabled={disabled}
              onClick={() => store.setSelectedId(source.id)}
              className={`text-left rounded-lg border overflow-hidden transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                selected
                  ? `${tw.primary.border} ${tw.bg.secondary}`
                  : `${tw.border} ${tw.bg.secondary} ${tw.hover}`
              }`}
            >
              <div
                className={`aspect-video flex items-center justify-center ${tw.bg.tertiary}`}
              >
                {source.thumbnail ? (
                  <img
                    src={source.thumbnail}
                    alt={source.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className={`text-xs ${tw.text.tertiary}`}>—</span>
                )}
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 min-w-0">
                {source.appIcon ? (
                  <img
                    src={source.appIcon}
                    alt=""
                    className="w-4 h-4 shrink-0"
                  />
                ) : null}
                <span
                  className={`text-xs truncate ${tw.text.secondary}`}
                  title={source.name}
                >
                  {source.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
})
