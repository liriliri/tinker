import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import store from './store'
import Toolbar from './components/Toolbar'
import ClipboardList from './components/ClipboardList'
import { ConfirmProvider } from 'share/components/Confirm'
import { ToasterProvider } from 'share/components/Toaster'
import { tw } from 'share/theme'

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
      <ToasterProvider>
        <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
          <Toolbar />
          <ClipboardList />
        </div>
      </ToasterProvider>
    </ConfirmProvider>
  )
})
