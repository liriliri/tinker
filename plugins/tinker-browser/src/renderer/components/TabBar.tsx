import { observer } from 'mobx-react-lite'
import { Globe } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import TabBar from 'share/components/TabBar'
import store from '../store'
import type { ITab } from '../../common/types'

export default observer(function BrowserTabBar() {
  const { t } = useTranslation()

  const renderIcon = (tab: ITab) => {
    if (tab.favicon) {
      return <img src={tab.favicon} className="w-4 h-4" alt="" />
    }
    return <Globe size={14} className={tw.text.tertiary} />
  }

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = store.tabs.find((t) => t.id === tabId)
    if (!tab) return

    const wv = store.webviewRefs.get(tabId)
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('addTabToRight'),
        click: () => store.addTab(undefined, tabId),
      },
      { type: 'separator' },
      {
        label: t('reload'),
        click: () => {
          if (wv) wv.reload()
        },
      },
      {
        label: t('duplicate'),
        click: () => store.addTab(tab.url, tabId),
      },
      {
        label: wv && wv.isAudioMuted() ? t('unmuteSite') : t('muteSite'),
        click: () => {
          if (wv) wv.setAudioMuted(!wv.isAudioMuted())
        },
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
          tabs.forEach((t) => {
            if (t.id !== tabId) store.closeTab(t.id)
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
      tabs={store.tabs}
      activeTabId={store.activeTabId}
      hideFirstBorder
      onAddTab={() => store.addTab()}
      onClose={(id) => store.closeTab(id)}
      onActivate={(id) => store.setActiveTab(id)}
      onMove={(from, to) => store.moveTab(from, to)}
      onContextMenu={handleContextMenu}
      renderIcon={renderIcon}
      isLoading={(tab) => tab.isLoading}
      getTitle={(tab) => tab.title || (tab.url ? tab.url : t('newTab'))}
    />
  )
})
