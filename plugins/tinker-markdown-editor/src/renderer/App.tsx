import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import MarkdownEditor from './components/MarkdownEditor'
import MarkdownPreview from './components/MarkdownPreview'
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

      // Check if the file is a Markdown file
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        console.warn('Only .md and .markdown files are supported')
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

      {/* Main Content - Split View */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Panel */}
        <div className="flex-1 min-w-0 border-r border-[#e0e0e0] dark:border-[#4a4a4a]">
          <MarkdownEditor />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 min-w-0">
          <MarkdownPreview />
        </div>
      </div>
    </div>
  )
})

export default App
