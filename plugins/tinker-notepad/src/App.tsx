import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { tw } from 'share/theme'
import TextEditor from './components/TextEditor'
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

      try {
        const filePath = (file as File & { path: string }).path
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
      <div className="flex-1 overflow-hidden">
        <TextEditor />
      </div>
    </div>
  )
})
