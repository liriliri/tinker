import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { PanelLeftClose } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const isVisible = store.sidebarOpen

  return (
    <div
      className={`
        w-56 h-full flex flex-col
        ${tw.bg.tertiary}
        transition-all duration-200
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        flexShrink: 0,
        marginLeft: isVisible ? 0 : -224,
      }}
    >
      <Toolbar>
        <div className="flex-1" />
        <ToolbarButton
          onClick={() => store.toggleSidebar()}
          title={t('hideSidebar')}
        >
          <PanelLeftClose size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <div className={`flex-1 border-r ${tw.border}`} />
    </div>
  )
})
