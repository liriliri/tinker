import { observer } from 'mobx-react-lite'
import { FolderGit2 } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import TabBar from 'share/components/TabBar'
import store from '../store'

export default observer(function GitTabBar() {
  const { t } = useTranslation()

  // Access tab.title for each tab so MobX tracks changes (see tinker-terminal)
  const tabs = store.tabs.map((tab) => ({
    ...tab,
    title: tab.title,
  }))

  const renderIcon = () => <FolderGit2 size={14} className={tw.text.tertiary} />

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = store.tabs.find((item) => item.id === tabId)
    if (!tab) return

    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('addTabToRight'),
        click: () => store.addTab(tabId),
      },
      { type: 'separator' },
      {
        label: t('closeTab'),
        click: () => store.closeTab(tabId),
      },
      {
        label: t('closeOtherTabs'),
        enabled: store.tabs.length > 1,
        click: () => {
          const tabs = [...store.tabs]
          tabs.forEach((item) => {
            if (item.id !== tabId) store.closeTab(item.id)
          })
        },
      },
      {
        label: t('closeTabsToRight'),
        enabled: store.tabs.indexOf(tab) < store.tabs.length - 1,
        click: () => {
          const index = store.tabs.indexOf(tab)
          const tabs = [...store.tabs]
          for (let i = tabs.length - 1; i > index; i--) {
            store.closeTab(tabs[i].id)
          }
        },
      },
    ])
  }

  return (
    <TabBar
      tabs={tabs}
      activeTabId={store.activeTabId}
      hideFirstBorder
      onAddTab={() => store.addTab()}
      onClose={(id) => store.closeTab(id)}
      onActivate={(id) => store.setActiveTab(id)}
      onMove={(from, to) => store.moveTab(from, to)}
      onContextMenu={handleContextMenu}
      renderIcon={renderIcon}
      isLoading={(tab) => tab.loading}
      getTitle={(tab) => tab.title || t('newTab')}
    />
  )
})
