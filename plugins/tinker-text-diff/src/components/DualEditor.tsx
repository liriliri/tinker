import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, FolderOpen } from 'lucide-react'
import { useRef, useEffect } from 'react'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import openFile from 'licia/openFile'
import store from '../store'
import { detectLanguageFromFileName } from '../lib/languageDetector'

export default observer(function DualEditor() {
  const { t } = useTranslation()
  const iconSize = 14
  const containerRef = useRef<HTMLDivElement>(null)

  const handleOriginalChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setOriginalText(value)
    }
  }

  const handleModifiedChange = (value: string | undefined) => {
    if (value !== undefined) {
      store.setModifiedText(value)
    }
  }

  const handleOriginalFileOpen = async () => {
    try {
      const files = await openFile({ accept: 'text/*' })
      if (files && files.length > 0) {
        const file = files[0]
        const content = await file.text()
        store.setOriginalText(content)
        store.setOriginalFileName(file.name)

        // Auto-detect language from file extension
        const detectedLanguage = detectLanguageFromFileName(file.name)
        store.setLanguage(detectedLanguage)
      }
    } catch (err) {
      console.error('Failed to read file:', err)
    }
  }

  const handleModifiedFileOpen = async () => {
    try {
      const files = await openFile({ accept: 'text/*' })
      if (files && files.length > 0) {
        const file = files[0]
        const content = await file.text()
        store.setModifiedText(content)
        store.setModifiedFileName(file.name)

        // Auto-detect language from file extension
        const detectedLanguage = detectLanguageFromFileName(file.name)
        store.setLanguage(detectedLanguage)
      }
    } catch (err) {
      console.error('Failed to read file:', err)
    }
  }

  const getLineCount = (text: string) => {
    if (isEmpty(text)) return 0
    return text.split('\n').length
  }

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

        // Determine which editor based on drop position
        const containerRect = container.getBoundingClientRect()
        const mouseX = e.clientX - containerRect.left
        const containerWidth = containerRect.width

        // Auto-detect language from file extension
        const detectedLanguage = detectLanguageFromFileName(file.name)
        store.setLanguage(detectedLanguage)

        // If dropped on left half, set as original; right half, set as modified
        if (mouseX < containerWidth / 2) {
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

  const buttonClass =
    'p-1.5 rounded transition-colors hover:bg-gray-300 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed'

  return (
    <div ref={containerRef} className="h-full w-full flex">
      {/* Left Editor - Original */}
      <div className="flex-1 min-w-0 border-r border-[#e0e0e0] dark:border-[#4a4a4a]">
        <div className="h-8 bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center justify-between px-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span>{t('original')}</span>
            <span className="text-xs opacity-70">
              {getLineCount(store.originalText)} {t('lines')}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleOriginalFileOpen}
              className={buttonClass}
              title={t('openFile')}
            >
              <FolderOpen size={iconSize} />
            </button>
            <button
              onClick={() => store.pasteToOriginal()}
              className={buttonClass}
              title={t('paste')}
            >
              <Clipboard size={iconSize} />
            </button>
            <button
              onClick={() => store.clearOriginal()}
              disabled={isStrBlank(store.originalText)}
              className={buttonClass}
              title={t('clear')}
            >
              <Eraser size={iconSize} />
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-2rem)]">
          <Editor
            value={store.originalText}
            language={store.language}
            onChange={handleOriginalChange}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            theme={store.isDark ? 'vs-dark' : 'vs'}
          />
        </div>
      </div>

      {/* Right Editor - Modified */}
      <div className="flex-1 min-w-0">
        <div className="h-8 bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center justify-between px-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <span>{t('modified')}</span>
            <span className="text-xs opacity-70">
              {getLineCount(store.modifiedText)} {t('lines')}
            </span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleModifiedFileOpen}
              className={buttonClass}
              title={t('openFile')}
            >
              <FolderOpen size={iconSize} />
            </button>
            <button
              onClick={() => store.pasteToModified()}
              className={buttonClass}
              title={t('paste')}
            >
              <Clipboard size={iconSize} />
            </button>
            <button
              onClick={() => store.clearModified()}
              disabled={isStrBlank(store.modifiedText)}
              className={buttonClass}
              title={t('clear')}
            >
              <Eraser size={iconSize} />
            </button>
          </div>
        </div>
        <div className="h-[calc(100%-2rem)]">
          <Editor
            value={store.modifiedText}
            language={store.language}
            onChange={handleModifiedChange}
            options={{
              readOnly: false,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
            theme={store.isDark ? 'vs-dark' : 'vs'}
          />
        </div>
      </div>
    </div>
  )
})
