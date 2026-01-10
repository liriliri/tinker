import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { tw, THEME_COLORS } from 'share/theme'
import Toolbar from './components/Toolbar'
import CalculationList from './components/CalculationList'
import store from './store'

export default observer(function App() {
  useEffect(() => {
    store.focusActiveLine()
  }, [])

  return (
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--toast-bg, #fff)',
            color: 'var(--toast-text, #333)',
          },
          success: {
            iconTheme: {
              primary: THEME_COLORS.primary,
              secondary: THEME_COLORS.bg.light.primary,
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
