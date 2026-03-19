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
import AiSection from './components/AiSection'

export default observer(function App() {
  useEffect(() => {
    store.loadSettings()
  }, [])

  return (
    <ToasterProvider>
      <ConfirmProvider>
        <div className={`h-screen flex transition-colors ${tw.bg.primary}`}>
          <Sidebar />
          {!store.isLoading && (
            <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6">
              {store.currentSection === 'general' && (
                <>
                  <AppearanceSection />
                  <StartupSection />
                  <WindowSection />
                </>
              )}
              {store.currentSection === 'ai' && <AiSection />}
            </div>
          )}
        </div>
      </ConfirmProvider>
    </ToasterProvider>
  )
})
