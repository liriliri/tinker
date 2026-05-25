import { observer } from 'mobx-react-lite'
import { Terminal as TerminalIcon, PanelLeft } from 'lucide-react'
import { tw } from 'share/theme'
import { useTranslation } from 'react-i18next'
import TabBar from 'share/components/TabBar'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import renderApp from 'share/lib/renderApp'
import store from './store'
import SplitLayout from './components/SplitLayout'
import Sidebar from './components/Sidebar'
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
    <ConfirmProvider>
      <PromptProvider>
        <div className="h-full flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <div
              className={`relative flex items-center h-10 min-h-[40px] ${tw.bg.secondary} z-10`}
              style={{ marginLeft: store.sidebarOpen ? -1 : 0 }}
            >
              {!store.sidebarOpen && (
                <div
                  className={`flex-shrink-0 flex items-center justify-center h-full px-1.5`}
                >
                  <button
                    className={`p-1.5 rounded transition-colors ${tw.hover}`}
                    onClick={() => store.toggleSidebar()}
                    title={t('showSidebar')}
                  >
                    <PanelLeft size={14} className={tw.text.secondary} />
                  </button>
                </div>
              )}
              <div className="flex-1 min-w-0 h-full">
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
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
              />
            </div>
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
        </div>
      </PromptProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
