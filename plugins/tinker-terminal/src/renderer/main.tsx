import { observer } from 'mobx-react-lite'
import { Terminal as TerminalIcon } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import TabBar from 'share/components/TabBar'
import renderApp from 'share/lib/renderApp'
import store from './store'
import SplitLayout from './components/SplitLayout'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = store.tabs.find((tab) => tab.id === tabId)
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

  // Access tab.title for each tab so MobX tracks changes
  const tabs = store.tabs.map((tab) => ({
    ...tab,
    title: tab.title,
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TabBar
        tabs={tabs}
        activeTabId={store.activeTabId}
        onAddTab={() => store.addTab()}
        onClose={(id) => store.closeTab(id)}
        onActivate={(id) => store.setActiveTab(id)}
        onMove={(from, to) => store.moveTab(from, to)}
        onContextMenu={handleContextMenu}
        renderIcon={() => (
          <TerminalIcon size={14} className={tw.text.tertiary} />
        )}
      />
      <div className="flex-1 relative overflow-hidden">
        {store.tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{
              display: tab.id === store.activeTabId ? 'block' : 'none',
            }}
          >
            <SplitLayout node={tab.layout} />
          </div>
        ))}
      </div>
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
