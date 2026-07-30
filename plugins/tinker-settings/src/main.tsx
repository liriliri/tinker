import { observer } from 'mobx-react-lite'
import { useEffect, type ReactNode } from 'react'
import { ToasterProvider } from 'share/components/Toaster'
import { ConfirmProvider } from 'share/components/Confirm'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import AppearanceSection from './components/AppearanceSection'
import StartupSection from './components/StartupSection'
import WindowSection from './components/WindowSection'
import NetworkSection from './components/NetworkSection'
import AiView from './components/AiView'
import PluginSection from './components/PluginSection'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

interface SettingsScrollAreaProps {
  children: ReactNode
}

function SettingsScrollArea({ children }: SettingsScrollAreaProps) {
  return (
    <OverlayScrollbars defer className="flex-1 min-h-0">
      <div className="px-6 pt-6 pb-6 space-y-6">{children}</div>
    </OverlayScrollbars>
  )
}

const App = observer(function App() {
  useEffect(() => {
    store.loadSettings()
  }, [])

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <div
          className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
        >
          <div className={`border-t ${tw.border}`} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            {!store.isLoading && store.currentSection === 'general' && (
              <SettingsScrollArea>
                <AppearanceSection />
                <StartupSection />
                <WindowSection />
                <NetworkSection />
              </SettingsScrollArea>
            )}
            {!store.isLoading && store.currentSection === 'ai' && (
              <div className="flex-1 overflow-hidden">
                <AiView />
              </div>
            )}
            {!store.isLoading && store.currentSection === 'plugin' && (
              <SettingsScrollArea>
                <PluginSection />
              </SettingsScrollArea>
            )}
          </div>
        </div>
      </ConfirmProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
