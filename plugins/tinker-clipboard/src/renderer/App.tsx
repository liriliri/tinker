import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import store from './store'
import Toolbar from './components/Toolbar'
import ClipboardList from './components/ClipboardList'
import { ConfirmProvider } from 'share/components/Confirm'
import { tw, THEME_COLORS } from 'share/theme'

export default observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    // Start monitoring clipboard when component mounts
    clipboard.startMonitoring((item) => {
      store.addItem(item)
    })

    // Cleanup: stop monitoring when component unmounts
    return () => {
      clipboard.stopMonitoring()
    }
  }, [])

  return (
    <ConfirmProvider locale={i18n.language}>
      <div className={`h-screen flex flex-col ${tw.bg.both.primary}`}>
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
        <ClipboardList />
      </div>
    </ConfirmProvider>
  )
})
