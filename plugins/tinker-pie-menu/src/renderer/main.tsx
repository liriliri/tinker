import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import store from './store'
import PieMenuView from './components/PieMenuView'
import ConfigPanel from './components/ConfigPanel'
import ActionDialog from './components/ActionDialog'
import { stopMiddleLongPress } from './lib/middleLongPress'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  useEffect(() => {
    void store.applyInvokeMode()
    return () => {
      void stopMiddleLongPress()
    }
  }, [])

  return (
    <ConfirmProvider>
      <ToasterProvider>
        <div
          className={`h-screen flex transition-colors overflow-hidden ${tw.bg.primary}`}
        >
          <div
            className={`w-[420px] shrink-0 flex items-center justify-center border-r ${tw.border} ${tw.bg.secondary}`}
          >
            <PieMenuView
              slots={store.slots}
              selectedIndex={store.selectedSlot}
              onSelectSlot={(index) => store.selectSlot(index)}
              size={320}
            />
          </div>
          <div className="flex-1 min-w-0">
            <ConfigPanel />
          </div>
          <ActionDialog />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
