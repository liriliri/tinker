import { observer } from 'mobx-react-lite'
import { Toaster } from 'react-hot-toast'
import { tw, THEME_COLORS } from 'share/theme'
import Toolbar from './components/Toolbar'
import ResultDisplay from './components/ResultDisplay'

export default observer(function App() {
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

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <ResultDisplay />
        </div>
      </div>
    </div>
  )
})
