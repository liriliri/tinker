import { useState, useEffect } from 'react'
import TextEditor from './components/TextEditor'
import TreeEditor from './components/TreeEditor'
import Toolbar from './components/Toolbar'

type EditorMode = 'text' | 'tree'

const STORAGE_KEY = 'tinker-json-editor-content'
const MODE_STORAGE_KEY = 'tinker-json-editor-mode'

export default function App() {
  const [jsonInput, setJsonInput] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved || ''
  })
  const [mode, setMode] = useState<EditorMode>(() => {
    // Load mode from localStorage on initial render
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    return (savedMode as EditorMode) || 'text'
  })

  // Save to localStorage whenever jsonInput changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, jsonInput)
  }, [jsonInput])

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  const handleInputChange = (value: string) => {
    setJsonInput(value)
  }

  const handleFormat = () => {
    if (!jsonInput.trim()) return

    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
    } catch (err) {
      console.error('Format error:', err)
    }
  }

  const handleMinify = () => {
    if (!jsonInput.trim()) return

    try {
      const parsed = JSON.parse(jsonInput)
      const minified = JSON.stringify(parsed)
      setJsonInput(minified)
    } catch (err) {
      console.error('Minify error:', err)
    }
  }

  const handleClear = () => {
    setJsonInput('')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonInput)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar
        onFormat={handleFormat}
        onMinify={handleMinify}
        onCopy={handleCopy}
        onClear={handleClear}
        disabled={!jsonInput.trim()}
        mode={mode}
        onModeChange={handleModeChange}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'text' ? (
          <TextEditor
            value={jsonInput}
            onChange={handleInputChange}
            language="json"
            className="h-full w-full"
          />
        ) : (
          <TreeEditor value={jsonInput} onChange={handleInputChange} />
        )}
      </div>
    </div>
  )
}
