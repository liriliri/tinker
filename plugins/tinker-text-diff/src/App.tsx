import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import DiffEditor from './components/DiffEditor'
import DualEditor from './components/DualEditor'
import Toolbar from './components/Toolbar'
import store from './store'
import { useDarkMode } from './hooks/useDarkMode'

const App = observer(() => {
  const isDark = useDarkMode()

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

      try {
        const content = await file.text()
        // If it's the first file or no original text, set as original
        if (!store.originalText.trim()) {
          store.setOriginalText(content)
        } else {
          // Otherwise set as modified text
          store.setModifiedText(content)
        }
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
        {store.mode === 'edit' ? (
          <DualEditor isDark={isDark} />
        ) : (
          <DiffEditor isDark={isDark} />
        )}
      </div>
    </div>
  )
})

export default App
