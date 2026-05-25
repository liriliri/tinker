import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { File } from 'lucide-react'
import { tw } from 'share/theme'
import TabBar from 'share/components/TabBar'
import renderApp from 'share/lib/renderApp'
import store from './store'
import Sidebar from './components/Sidebar'
import EditorPane from './components/EditorPane'
import StatusBar from './components/StatusBar'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'
import './index.scss'

const App = observer(function App() {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        store.saveFile()
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

  const tabs = store.tabs.map((tab) => ({
    ...tab,
    title: tab.isDirty ? `● ${tab.title}` : tab.title,
  }))

  return (
    <div className="relative h-full flex flex-col overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-px z-20 ${tw.bg.border}`}
      />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 -ml-px">
          {store.tabs.length > 0 && (
            <div
              className={`relative flex items-center h-10 min-h-[40px] ${tw.bg.secondary}`}
            >
              <div className="flex-1 min-w-0 h-full">
                <TabBar
                  tabs={tabs}
                  activeTabId={store.activeTabId}
                  onClose={(id) => store.closeTab(id)}
                  onActivate={(id) => store.setActiveTab(id)}
                  onMove={(from, to) => store.moveTab(from, to)}
                  onContextMenu={handleContextMenu}
                  renderIcon={() => (
                    <File size={14} className={tw.text.tertiary} />
                  )}
                />
              </div>
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
                    display: tab.id === store.activeTabId ? 'block' : 'none',
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
      </div>
      <StatusBar />
    </div>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
