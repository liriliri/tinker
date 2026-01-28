import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'
import Toolbar from './components/Toolbar'
import CalculationList from './components/CalculationList'
import store from './store'

export default observer(function App() {
  useEffect(() => {
    store.focusActiveLine()
  }, [])

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.both.primary}`}>
        <Toolbar />
        <div className="flex-1 overflow-auto">
          <CalculationList />
        </div>
      </div>
    </ToasterProvider>
  )
})
