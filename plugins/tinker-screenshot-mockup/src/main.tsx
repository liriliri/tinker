import { observer } from 'mobx-react-lite'
import { type DragEvent } from 'react'
import isEmpty from 'licia/isEmpty'
import startWith from 'licia/startWith'
import toArr from 'licia/toArr'
import { tw } from 'share/theme'
import { ToasterProvider } from 'share/components/Toaster'
import { AlertProvider } from 'share/components/Alert'
import renderApp from 'share/lib/renderApp'
import Toolbar from './components/Toolbar'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import store from './store'
import './index.scss'
import enUS from './i18n/en-US.json'
import zhCN from './i18n/zh-CN.json'

const App = observer(function App() {
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = toArr(e.dataTransfer.files)
    if (isEmpty(files)) return
    const file = files[0]
    if (!startWith(file.type, 'image/')) return
    await store.loadScreenshotForSelected(file)
  }

  return (
    <ToasterProvider>
      <AlertProvider>
        <div
          className={`h-screen flex flex-col ${tw.bg.primary}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Toolbar />
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 relative">
              <Canvas />
            </div>
            <Sidebar />
          </div>
        </div>
      </AlertProvider>
    </ToasterProvider>
  )
})

renderApp(App, { 'en-US': enUS, 'zh-CN': zhCN })
