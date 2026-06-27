import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { PanelLeft, PanelLeftClose } from 'lucide-react'
import {
  StatusBar,
  StatusBarItem,
  StatusBarSpacer,
} from 'share/components/StatusBar'
import store from '../store'

export default observer(function StatusBarComponent() {
  const { t } = useTranslation()
  const tab = store.activeTab

  return (
    <StatusBar>
      <StatusBarItem onClick={() => store.toggleSidebar()}>
        {store.sidebarOpen ? (
          <PanelLeftClose size={14} />
        ) : (
          <PanelLeft size={14} />
        )}
      </StatusBarItem>
      <StatusBarSpacer />
      {!tab?.connected && (
        <StatusBarItem clickable={false}>{t('notConnected')}</StatusBarItem>
      )}
      {tab?.connected && (
        <>
          <StatusBarItem clickable={false}>
            {tab.isFiltering
              ? t('filteredItemCount', {
                  visible: tab.visibleEntries.length,
                  total: tab.listableEntries.length,
                })
              : t('itemCount', { count: tab.visibleEntries.length })}
          </StatusBarItem>
          {tab.selectedPaths.length > 0 && (
            <StatusBarItem clickable={false}>
              {t('selectedCount', { count: tab.selectedPaths.length })}
            </StatusBarItem>
          )}
        </>
      )}
    </StatusBar>
  )
})
