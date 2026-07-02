import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import endWith from 'licia/endWith'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import store from './store'
import renderApp from 'share/lib/renderApp'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]

      if (!endWith(file.name, '.json')) {
        console.warn('Only .json files are supported')
        return
      }

      try {
        const filePath = (file as File & { path?: string }).path
        const content = await file.text()
        store.loadFromFile(content, filePath)
      } catch (err) {
        console.error('Failed to read file:', err)
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <ToasterProvider>
      <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
        <Toolbar />

        <div className={`flex-1 overflow-hidden ${tw.bg.primary}`}>
          {store.mode === 'text' ? <TextEditor /> : <TreeEditor />}
        </div>
      </div>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
