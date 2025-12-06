import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
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
      if (!file.name.endsWith('.json')) {
        console.warn('Only .json files are supported')
        return
      }

      try {
        const content = await file.text()
        store.loadFromFile(content)
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
    <div className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]">
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-[#1e1e1e]">
        {store.mode === 'text' ? <TextEditor /> : <TreeEditor />}
      </div>
    </div>
  )
})

export default App
