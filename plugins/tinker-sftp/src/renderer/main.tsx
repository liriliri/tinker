import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { ToasterProvider } from 'share/components/Toaster'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Sidebar from './components/Sidebar'
import ExplorerPane from './components/ExplorerPane'
import StatusBar from './components/StatusBar'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('closeTab'),
        click: () => void store.closeTab(tabId),
      },
      {
        label: t('closeOtherTabs'),
        enabled: store.tabs.length > 1,
        click: () => {
          const tabs = [...store.tabs]
          tabs.forEach((tab) => {
            if (tab.id !== tabId) void store.closeTab(tab.id)
          })
        },
      },
      { type: 'separator' },
      {
        label: t('disconnect'),
        enabled: store.tabs.find((tab) => tab.id === tabId)?.connected ?? false,
        click: () => void store.disconnectTab(tabId),
      },
    ])
  }

  return (
    <ConfirmProvider>
      <PromptProvider>
        <ToasterProvider>
          <div
            className={`relative h-screen flex flex-col overflow-hidden transition-colors ${tw.bg.primary}`}
          >
            <div
              className={`absolute top-0 left-0 right-0 h-px z-20 ${tw.bg.border}`}
            />
            <div className="flex-1 flex min-h-0">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                {store.tabs.length > 0 && (
                  <div
                    className={`relative flex items-center h-10 min-h-[40px] mt-px ${tw.bg.secondary}`}
                  >
                    <div className="flex-1 min-w-0 h-full">
                      <TabBar
                        tabs={store.tabs}
                        activeTabId={store.activeTabId}
                        hideFirstBorder
                        onClose={(id) => void store.closeTab(id)}
                        onActivate={(id) => store.setActiveTab(id)}
                        onMove={(from, to) => store.moveTab(from, to)}
                        onContextMenu={handleContextMenu}
                        isLoading={(tab) => tab.connecting}
                        renderIcon={() => (
                          <Globe size={14} className={tw.text.tertiary} />
                        )}
                      />
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
                    />
                  </div>
                )}
                <div className="flex-1 min-h-0 relative overflow-hidden">
                  {store.tabs.length === 0 ? (
                    <div
                      className={`flex flex-col items-center justify-center h-full gap-2 ${tw.text.tertiary}`}
                    >
                      <p className="text-sm">{t('notConnected')}</p>
                    </div>
                  ) : (
                    store.tabs.map((tab) => (
                      <div
                        key={tab.id}
                        className="absolute inset-0"
                        style={{
                          display:
                            tab.id === store.activeTabId ? 'block' : 'none',
                        }}
                      >
                        <ExplorerPane tab={tab} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <StatusBar />
          </div>
        </ToasterProvider>
      </PromptProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
