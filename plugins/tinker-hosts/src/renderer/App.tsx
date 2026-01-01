import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
import { tw } from 'share/theme'
import store from './store'
import { Sidebar, Editor } from './components'

export default observer(function App() {
  useEffect(() => {
    store.loadSystemHosts()
  }, [])

  return (
    <AlertProvider>
      <ConfirmProvider>
        <PromptProvider>
          <div
            className={`h-screen flex overflow-hidden ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
          >
            <Sidebar />
            <Editor />
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
