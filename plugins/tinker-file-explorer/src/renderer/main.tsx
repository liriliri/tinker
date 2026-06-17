import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import copy from 'licia/copy'
import { Folder } from 'lucide-react'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
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
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-file-explorer-layout-v2',
    storage: localStorage,
  })

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    tinker.showContextMenu(e.clientX, e.clientY, [
      {
        label: t('closeTab'),
        click: () => store.closeTab(tabId),
      },
      {
        label: t('closeOtherTabs'),
        enabled: store.tabs.length > 1,
        click: () => {
          const tabs = [...store.tabs]
          tabs.forEach((tab) => {
            if (tab.id !== tabId) store.closeTab(tab.id)
          })
        },
      },
      { type: 'separator' },
      {
        label: t('copyPath'),
        click: () => {
          const tab = store.tabs.find((item) => item.id === tabId)
          if (tab) copy(tab.path)
        },
      },
    ])
  }

  return (
    <ConfirmProvider>
      <PromptProvider>
        <div className="relative h-full flex flex-col overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-px z-20 ${tw.bg.border}`}
          />
          <div className="flex-1 flex min-h-0">
            <Group
              orientation="horizontal"
              className="flex-1 h-full"
              defaultLayout={defaultLayout}
              onLayoutChange={onLayoutChange}
            >
              {store.sidebarOpen && (
                <Panel
                  id="sidebar"
                  defaultSize="30%"
                  minSize="15%"
                  maxSize="40%"
                >
                  <Sidebar />
                </Panel>
              )}
              {store.sidebarOpen && <Separator />}
              <Panel id="main" minSize="60%">
                <div className="flex flex-col h-full">
                  {store.tabs.length > 0 && (
                    <div
                      className={`relative flex items-center h-10 min-h-[40px] mt-px ${tw.bg.secondary}`}
                    >
                      <div className="flex-1 min-w-0 h-full">
                        <TabBar
                          tabs={store.tabs}
                          activeTabId={store.activeTabId}
                          hideFirstBorder
                          onAddTab={() =>
                            store.addTab(fileExplorer.getHomedir())
                          }
                          onClose={(id) => store.closeTab(id)}
                          onActivate={(id) => store.setActiveTab(id)}
                          onMove={(from, to) => store.moveTab(from, to)}
                          onContextMenu={handleContextMenu}
                          isLoading={(tab) => tab.loading}
                          renderIcon={() => (
                            <Folder size={14} className={tw.text.tertiary} />
                          )}
                        />
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
                      />
                    </div>
                  )}
                  <div className="flex-1 relative overflow-hidden min-h-0">
                    {store.tabs.map((tab) => (
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
                    ))}
                  </div>
                </div>
              </Panel>
            </Group>
          </div>
          <StatusBar />
        </div>
      </PromptProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
