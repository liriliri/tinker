import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import {
  AlertProvider,
  ConfirmProvider,
  PromptProvider,
} from 'share/renderer/components'
import store from './store'
import { Sidebar, Editor } from './components'

export default observer(function App() {
  useEffect(() => {
    const init = async () => {
      await store.loadConfig()
      await store.loadSystemHosts()
    }
    init()
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
