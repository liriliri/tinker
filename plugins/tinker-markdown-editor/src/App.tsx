import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import endWith from 'licia/endWith'
import className from 'licia/className'
import { tw } from 'share/theme'
import MarkdownEditor from './components/MarkdownEditor'
import MarkdownPreview from './components/MarkdownPreview'
import Toolbar from './components/Toolbar'
import store from './store'

export default observer(function App() {
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
      if (!endWith(file.name, '.md') && !endWith(file.name, '.markdown')) {
        console.warn('Only .md and .markdown files are supported')
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
    <div className={`h-screen flex flex-col ${tw.bg.primary}`}>
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor Panel */}
        {(store.viewMode === 'split' || store.viewMode === 'editor') && (
          <div
            className={className(
              'flex-1 min-w-0',
              store.viewMode === 'split' && ['border-r', tw.border.both]
            )}
          >
            <MarkdownEditor />
          </div>
        )}

        {/* Preview Panel */}
        {(store.viewMode === 'split' || store.viewMode === 'preview') && (
          <div className="flex-1 min-w-0">
            <MarkdownPreview />
          </div>
        )}
      </div>
    </div>
  )
})
