import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { File, GitCommit } from 'lucide-react'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Sidebar from './components/Sidebar'
import EditorPane from './components/EditorPane'
import StatusBar from './components/StatusBar'
import TerminalPanel from './components/TerminalPanel'
import Welcome from './components/Welcome'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['editor', 'terminal'],
    id: 'tinker-code-editor-layout',
    storage: localStorage,
  })
  const {
    defaultLayout: sidebarDefaultLayout,
    onLayoutChange: onSidebarLayoutChange,
  } = useDefaultLayout({
    panelIds: ['sidebar', 'main'],
    id: 'tinker-code-editor-sidebar-layout',
    storage: localStorage,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        store.saveFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '`') {
        e.preventDefault()
        store.toggleTerminal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    const tab = store.tabs.find((tab) => tab.id === tabId)
    if (!tab) return

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
          tabs.forEach((t) => {
            if (t.id !== tabId) store.closeTab(t.id)
          })
        },
      },
      { type: 'separator' },
      {
        label: t('save'),
        click: () => store.saveFile(tabId),
      },
    ])
  }

  void store.tabDirtyRevision

  if (!store.rootPath) {
    return <Welcome />
  }

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-px z-20 ${tw.bg.border}`}
      />
      <div className="flex-1 flex min-h-0">
        <Group
          orientation="horizontal"
          className="flex-1 h-full"
          defaultLayout={sidebarDefaultLayout}
          onLayoutChange={onSidebarLayoutChange}
        >
          {store.sidebarOpen && (
            <Panel id="sidebar" defaultSize={224} minSize={180}>
              <Sidebar />
            </Panel>
          )}
          {store.sidebarOpen && <Separator />}
          <Panel id="main" minSize={200}>
            <div className="flex flex-col h-full">
              <Group
                orientation="vertical"
                className="h-full"
                defaultLayout={defaultLayout}
                onLayoutChange={onLayoutChange}
              >
                <Panel id="editor">
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
                            onClose={(id) => store.closeTab(id)}
                            onActivate={(id) => store.setActiveTab(id)}
                            onMove={(from, to) => store.moveTab(from, to)}
                            onContextMenu={handleContextMenu}
                            renderIcon={(tab) =>
                              tab.isDirty ? (
                                <span
                                  className={`inline-block w-1.5 h-1.5 rounded-full ${tw.primary.bg}`}
                                  aria-hidden
                                />
                              ) : (
                                <File size={14} className={tw.text.tertiary} />
                              )
                            }
                          />
                        </div>
                        <button
                          onClick={() => store.toggleBlame()}
                          className={`w-7 h-7 ml-1 mr-1 flex items-center justify-center rounded opacity-40 hover:opacity-100 hover:bg-white/10 transition-all ${
                            store.showingBlame
                              ? `opacity-100 ${tw.primary.text}`
                              : ''
                          }`}
                          title={
                            store.showingBlame ? t('blameHide') : t('blame')
                          }
                        >
                          <GitCommit size={14} />
                        </button>
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
                        />
                      </div>
                    )}
                    <div className="flex-1 relative overflow-hidden">
                      {store.tabs.length > 0 ? (
                        store.tabs.map((tab) => (
                          <div
                            key={tab.id}
                            className="absolute inset-0"
                            style={{
                              display:
                                tab.id === store.activeTabId ? 'block' : 'none',
                            }}
                          >
                            <EditorPane tabId={tab.id} />
                          </div>
                        ))
                      ) : (
                        <div
                          className={`flex items-center justify-center h-full ${tw.text.tertiary} text-sm`}
                        >
                          {t('openFileToEdit')}
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
                {store.terminalOpen && <Separator />}
                {store.terminalOpen && (
                  <Panel id="terminal" defaultSize={200} minSize={100}>
                    <TerminalPanel />
                  </Panel>
                )}
              </Group>
            </div>
          </Panel>
        </Group>
      </div>
      <StatusBar />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
