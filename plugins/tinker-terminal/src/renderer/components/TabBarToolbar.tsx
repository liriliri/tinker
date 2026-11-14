import { observer } from 'mobx-react-lite'
import { Columns2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DarkModeSwitch from 'share/components/DarkModeSwitch'
import {
  Toolbar,
  ToolbarAiButton,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function TabBarToolbar() {
  const { t } = useTranslation()

  return (
    <Toolbar className="border-b-0 shrink-0">
      <DarkModeSwitch
        dark={store.darkMode}
        onToggle={() => store.setDarkMode(!store.darkMode)}
        title={store.darkMode ? t('darkMode') : t('lightMode')}
        className="mr-1"
      />
      <ToolbarButton
        onClick={() => store.setDualColumns()}
        menu={[
          {
            label: t('dualColumns'),
            click: () => store.setDualColumns(),
          },
          {
            label: t('tripleColumns'),
            click: () => store.setTripleColumns(),
          },
          {
            label: t('gridLayout'),
            click: () => store.setGrid(),
          },
        ]}
        title={t('dualColumns')}
      >
        <Columns2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {store.hasAI && (
        <ToolbarAiButton
          onClick={() => store.toggleActiveTabChat()}
          title={t('chatTitle')}
        />
      )}
    </Toolbar>
  )
})
