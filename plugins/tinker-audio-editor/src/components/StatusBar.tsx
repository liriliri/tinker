import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import store from '../store'
import { formatTime } from '../lib/audioUtils'

export default observer(function StatusBarComponent() {
  const { t } = useTranslation()

  return (
    <StatusBar>
      <StatusBarItem clickable={false}>
        {t('duration')}: {formatTime(store.duration)}
      </StatusBarItem>
      <StatusBarItem clickable={false}>
        {t('cursor')}: {formatTime(store.currentTime)}
      </StatusBarItem>
      {store.hasSelection && (
        <>
          <StatusBarSpacer />
          <StatusBarItem clickable={false} className={tw.primary.text}>
            {formatTime(store.selectionStart!)} -{' '}
            {formatTime(store.selectionEnd!)}
            {' ('}
            {formatTime(store.selectionEnd! - store.selectionStart!)}
            {')'}
          </StatusBarItem>
        </>
      )}
    </StatusBar>
  )
})
