import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Toolbar from './components/Toolbar'
import CalculationList from './components/CalculationList'
import store from './store'

const App = observer(() => {
  useEffect(() => {
    store.focusActiveLine()
  }, [])

  return (
    <div className="h-screen bg-[#f0f1f2] dark:bg-[#303133] flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-text, #333)',
          },
          success: {
            iconTheme: {
              primary: '#0fc25e',
              secondary: '#fff',
            },
          },
        }}
      />
      <Toolbar />
      <div className="flex-1 overflow-auto">
        <CalculationList />
      </div>
    </div>
  )
})

export default App
