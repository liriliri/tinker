import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import { AlertProvider } from 'share/components/Alert'
import { tw, THEME_COLORS } from 'share/theme'
import DualPanel from './components/DualPanel'

export default observer(function App() {
  const { i18n } = useTranslation()

  return (
    <AlertProvider locale={i18n.language}>
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
      <div
        className={`h-screen flex flex-col transition-colors ${tw.bg.both.primary}`}
      >
        <div className="flex-1 overflow-hidden">
          <DualPanel />
        </div>
      </div>
    </AlertProvider>
  )
})
