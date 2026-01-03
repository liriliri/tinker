import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import endWith from 'licia/endWith'
import { tw } from 'share/theme'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'
import store from './store'

const App = observer(() => {
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

      // Check if the file is a JSON file
      if (!endWith(file.name, '.json')) {
        console.warn('Only .json files are supported')
        return
      }

      try {
        const filePath = (file as any).path
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
    <div
      className={`h-screen flex flex-col ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
    >
      <Toolbar />

      {/* Main Content */}
      <div
        className={`flex-1 overflow-hidden ${tw.bg.light.primary} ${tw.bg.dark.primary}`}
      >
        {store.mode === 'text' ? <TextEditor /> : <TreeEditor />}
      </div>
    </div>
  )
})

export default App
