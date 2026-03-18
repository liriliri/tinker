import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import AppearanceSection from './components/AppearanceSection'
import StartupSection from './components/StartupSection'
import WindowSection from './components/WindowSection'

export default observer(function App() {
  useEffect(() => {
    store.loadSettings()
  }, [])

  return (
    <ToasterProvider>
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.primary}`}
      >
        {!store.isLoading && (
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">
            <AppearanceSection />
            <StartupSection />
            <WindowSection />
          </div>
        )}
      </div>
    </ToasterProvider>
  )
})
