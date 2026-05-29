import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Pause, Play } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarButton
        variant="toggle"
        active={store.paused}
        title={store.paused ? t('resume') : t('pause')}
        onClick={() => store.togglePaused()}
      >
        {store.paused ? (
          <Play size={TOOLBAR_ICON_SIZE} />
        ) : (
          <Pause size={TOOLBAR_ICON_SIZE} />
        )}
      </ToolbarButton>
    </Toolbar>
  )
})
