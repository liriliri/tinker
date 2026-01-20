import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'

export default observer(function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    store.loadSystemHosts()
  }, [])

  return (
    <AlertProvider locale={i18n.language}>
      <ConfirmProvider locale={i18n.language}>
        <PromptProvider locale={i18n.language}>
          <div
            className={`h-screen flex overflow-hidden ${tw.bg.both.primary}`}
          >
            <Sidebar />
            <Editor />
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
