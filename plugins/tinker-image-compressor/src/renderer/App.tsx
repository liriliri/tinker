import { observer } from 'mobx-react-lite'
import Toolbar from './components/Toolbar'
import ImageUpload from './components/ImageUpload'
import ImageList from './components/ImageList'
import store from './store'

const App = observer(() => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    // Filter image files only
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length === 0) {
      console.warn('Only image files are supported')
      return
    }

    try {
      const fileArray = imageFiles.map((file) => {
        // In Electron, the File object has a path property
        const filePath = (file as any).path
        return { file, filePath }
      })
      await store.loadImages(fileArray)
    } catch (err) {
      console.error('Failed to load images:', err)
    }
  }

  return (
    <div
      className="h-screen flex flex-col bg-[#f0f1f2] dark:bg-[#303133]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Toolbar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!store.hasImages ? <ImageUpload /> : <ImageList />}
      </div>
    </div>
  )
})

export default App
