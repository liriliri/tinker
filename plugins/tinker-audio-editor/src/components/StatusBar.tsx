import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatTime } from '../lib/audioUtils'

export default observer(function StatusBar() {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-4 px-4 py-1.5 text-xs ${tw.text.secondary} ${tw.bg.tertiary} border-t ${tw.border}`}
    >
      <span className="truncate max-w-[160px]" title={store.fileName}>
        {store.fileName || t('noFile')}
      </span>
      <span className="shrink-0">
        {t('duration')}: {formatTime(store.duration)}
      </span>
      <span className="shrink-0">
        {t('cursor')}: {formatTime(store.currentTime)}
      </span>
      {store.hasSelection && (
        <span className={`shrink-0 ${tw.primary.text}`}>
          {t('selection')}: {formatTime(store.selectionStart!)} -{' '}
          {formatTime(store.selectionEnd!)}
          {' ('}
          {formatTime(store.selectionEnd! - store.selectionStart!)}
          {')'}
        </span>
      )}
      {store.canUndo && (
        <span className="ml-auto shrink-0">
          {store.undoStack[store.undoStack.length - 1]?.label}
        </span>
      )}
    </div>
  )
})
