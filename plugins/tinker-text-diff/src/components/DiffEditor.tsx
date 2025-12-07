import { observer } from 'mobx-react-lite'
import { DiffEditor as MonacoDiffEditor } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { editor } from 'monaco-editor'
import store from '../store'
import { detectLanguageFromFileName } from '../lib/languageDetector'

export default observer(function DiffEditor() {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEditorDidMount = (editor: editor.IStandaloneDiffEditor) => {
    const updateDiffStats = () => {
      // Need to wait a bit for Monaco to compute the diff
      setTimeout(() => {
        const changes = editor.getLineChanges()
        if (changes && changes.length > 0) {
          let additions = 0
          let deletions = 0

          changes.forEach((change) => {
            const modifiedLines =
              change.modifiedEndLineNumber > 0
                ? change.modifiedEndLineNumber -
                  change.modifiedStartLineNumber +
                  1
                : 0
            const originalLines =
              change.originalEndLineNumber > 0
                ? change.originalEndLineNumber -
                  change.originalStartLineNumber +
                  1
                : 0

            // Pure addition (no original lines)
            if (originalLines === 0 && modifiedLines > 0) {
              additions += modifiedLines
            }
            // Pure deletion (no modified lines)
            else if (modifiedLines === 0 && originalLines > 0) {
              deletions += originalLines
            }
            // Modification (both have lines)
            else if (originalLines > 0 && modifiedLines > 0) {
              // Count all modified lines as both additions and deletions
              additions += modifiedLines
              deletions += originalLines
            }
          })

          store.setDiffStats({ additions, deletions })
        } else {
          store.setDiffStats({ additions: 0, deletions: 0 })
        }
      }, 100)
    }

    // Update stats on mount
    updateDiffStats()

    // Update stats when content changes
    const originalModel = editor.getOriginalEditor().getModel()
    const modifiedModel = editor.getModifiedEditor().getModel()

    const disposables: { dispose: () => void }[] = []
    if (originalModel) {
      disposables.push(
        originalModel.onDidChangeContent(() => updateDiffStats())
      )
    }
    if (modifiedModel) {
      disposables.push(
        modifiedModel.onDidChangeContent(() => updateDiffStats())
      )
    }

    return () => {
      disposables.forEach((d) => d.dispose())
    }
  }

  useEffect(() => {
    // Reset stats when unmounting
    return () => {
      store.setDiffStats({ additions: 0, deletions: 0 })
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

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

        // Auto-detect language from file extension
        const detectedLanguage = detectLanguageFromFileName(file.name)
        store.setLanguage(detectedLanguage)

        // In diff mode, if original is empty, set as original; otherwise set as modified
        if (!store.originalText.trim()) {
          store.setOriginalText(content)
          store.setOriginalFileName(file.name)
        } else {
          store.setModifiedText(content)
          store.setModifiedFileName(file.name)
        }
      } catch (err) {
        console.error('Failed to read file:', err)
      }
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)

    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }, [])

  return (
    <div ref={containerRef} className="h-full w-full">
      <MonacoDiffEditor
        original={store.originalText}
        modified={store.modifiedText}
        language={store.language}
        theme={store.isDark ? 'vs-dark' : 'vs'}
        onMount={handleEditorDidMount}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderSideBySide: true,
          enableSplitViewResizing: true,
          wordWrap: 'on',
        }}
      />
    </div>
  )
})
