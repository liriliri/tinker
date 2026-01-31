import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import type { Monaco } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import { Clipboard, Eraser, FolderOpen } from 'lucide-react'
import { useRef, useEffect } from 'react'
import isEmpty from 'licia/isEmpty'
import isStrBlank from 'licia/isStrBlank'
import openFile from 'licia/openFile'
import { tw } from 'share/theme'
import {
  Toolbar,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import store from '../store'
import { detectLanguageFromFileName } from '../lib/languageDetector'

export default observer(function DualEditor() {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }

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

  return (
    <div className="h-full flex flex-col">
      <div ref={containerRef} className="flex-1 w-full flex overflow-hidden">
        {/* Left Editor - Original */}
        <div className={`flex-1 min-w-0 border-r ${tw.border.both}`}>
          <Editor
            value={store.originalText}
            language={store.language}
            onChange={handleOriginalChange}
            beforeMount={handleEditorWillMount}
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

        {/* Right Editor - Modified */}
        <div className="flex-1 min-w-0">
          <Editor
            value={store.modifiedText}
            language={store.language}
            onChange={handleModifiedChange}
            beforeMount={handleEditorWillMount}
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

      {/* Bottom Toolbars */}
      <div className="flex">
        {/* Left Toolbar - Original */}
        <div className={`flex-1 border-r ${tw.border.both}`}>
          <Toolbar className="justify-between border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>{t('original')}</span>
              <span className="text-xs opacity-70">
                {getLineCount(store.originalText)} {t('lines')}
              </span>
            </div>
            <div className="flex gap-1">
              <ToolbarButton
                onClick={handleOriginalFileOpen}
                title={t('openFile')}
              >
                <FolderOpen size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => store.pasteToOriginal()}
                title={t('paste')}
              >
                <Clipboard size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => store.clearOriginal()}
                disabled={isStrBlank(store.originalText)}
                title={t('clear')}
              >
                <Eraser size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
            </div>
          </Toolbar>
        </div>

        {/* Right Toolbar - Modified */}
        <div className="flex-1">
          <Toolbar className="justify-between border-t">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>{t('modified')}</span>
              <span className="text-xs opacity-70">
                {getLineCount(store.modifiedText)} {t('lines')}
              </span>
            </div>
            <div className="flex gap-1">
              <ToolbarButton
                onClick={handleModifiedFileOpen}
                title={t('openFile')}
              >
                <FolderOpen size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => store.pasteToModified()}
                title={t('paste')}
              >
                <Clipboard size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => store.clearModified()}
                disabled={isStrBlank(store.modifiedText)}
                title={t('clear')}
              >
                <Eraser size={TOOLBAR_ICON_SIZE} />
              </ToolbarButton>
            </div>
          </Toolbar>
        </div>
      </div>
    </div>
  )
})
