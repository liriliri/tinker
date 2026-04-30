import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { ToasterProvider } from 'share/components/Toaster'
import { ConfirmProvider } from 'share/components/Confirm'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import AppearanceSection from './components/AppearanceSection'
import StartupSection from './components/StartupSection'
import WindowSection from './components/WindowSection'
import AiView from './components/AiView'
import PluginSection from './components/PluginSection'

export default observer(function App() {
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
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6">
                <AppearanceSection />
                <StartupSection />
                <WindowSection />
              </div>
            )}
            {!store.isLoading && store.currentSection === 'ai' && (
              <div className="flex-1 overflow-hidden">
                <AiView />
              </div>
            )}
            {!store.isLoading && store.currentSection === 'plugin' && (
              <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6">
                <PluginSection />
              </div>
            )}
          </div>
        </div>
      </ConfirmProvider>
    </ToasterProvider>
  )
})
