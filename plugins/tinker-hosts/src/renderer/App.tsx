import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import store from './store'
import { Sidebar, Editor } from './components'

const App = observer(() => {
  useEffect(() => {
    const init = async () => {
      await store.loadConfig()
      await store.loadSystemHosts()
    }
    init()
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-white dark:bg-[#1e1e1e]">
      <Sidebar />
      <Editor />
    </div>
  )
})

export default App
