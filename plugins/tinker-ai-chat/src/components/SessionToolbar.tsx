import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Eraser } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function SessionToolbar() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <span
        className={`px-2 text-sm font-medium truncate max-w-[180px] ${tw.text.primary}`}
      >
        {store.activeSession?.title || t('newChat')}
      </span>
      <ToolbarSpacer />
      <ToolbarButton
        title={t('clearMessages')}
        onClick={() => store.clearMessages()}
        disabled={!store.activeSession?.messages.length}
      >
        <Eraser size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
    </Toolbar>
  )
})
