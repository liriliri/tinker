import { observer } from 'mobx-react-lite'
import { Columns2, Columns3, Grid2x2, MessageSquare } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function TabBarToolbar() {
  const { t } = useTranslation()

  return (
    <Toolbar className="border-b-0 shrink-0">
      <ToolbarButton
        onClick={() => store.setDualColumns()}
        title={t('dualColumns')}
      >
        <Columns2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => store.setTripleColumns()}
        title={t('tripleColumns')}
      >
        <Columns3 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton onClick={() => store.setGrid()} title={t('gridLayout')}>
        <Grid2x2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {store.hasAI && (
        <>
          <ToolbarSeparator />
          <ToolbarButton
            variant="toggle"
            active={store.activeTabChatOpen}
            onClick={() => store.toggleActiveTabChat()}
            title={t('chatTitle')}
          >
            <MessageSquare size={TOOLBAR_ICON_SIZE} />
          </ToolbarButton>
        </>
      )}
    </Toolbar>
  )
})
