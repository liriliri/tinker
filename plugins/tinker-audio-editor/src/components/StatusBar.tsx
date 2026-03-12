import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import { formatTime } from '../lib/audioUtils'

export default observer(function StatusBar() {
  const { t } = useTranslation()

  return (
    <div
      className={`flex items-center gap-4 px-4 py-0.5 text-xs ${tw.text.secondary} ${tw.bg.tertiary} border-t ${tw.border}`}
    >
      <span className="shrink-0">
        {t('duration')}: {formatTime(store.duration)}
      </span>
      <span className="shrink-0">
        {t('cursor')}: {formatTime(store.currentTime)}
      </span>
      {store.hasSelection && (
        <span className={`ml-auto shrink-0 ${tw.primary.text}`}>
          {formatTime(store.selectionStart!)} -{' '}
          {formatTime(store.selectionEnd!)}
          {' ('}
          {formatTime(store.selectionEnd! - store.selectionStart!)}
          {')'}
        </span>
      )}
    </div>
  )
})
