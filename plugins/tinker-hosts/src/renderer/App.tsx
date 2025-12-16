import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { AlertProvider } from 'share/components/Alert'
import { ConfirmProvider } from 'share/components/Confirm'
import { PromptProvider } from 'share/components/Prompt'
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
          <div className="h-screen flex overflow-hidden bg-white dark:bg-[#1e1e1e]">
            <Sidebar />
            <Editor />
          </div>
        </PromptProvider>
      </ConfirmProvider>
    </AlertProvider>
  )
})
