import { observer } from 'mobx-react-lite'
import { Editor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import store from '../store'

interface DualEditorProps {
  isDark: boolean
}

export default observer(function DualEditor({ isDark }: DualEditorProps) {
  const { t } = useTranslation()

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

  return (
    <div className="h-full w-full flex">
      {/* Left Editor - Original */}
      <div className="flex-1 border-r border-[#e0e0e0] dark:border-[#4a4a4a]">
        <div className="h-8 bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center px-3 text-sm text-gray-600 dark:text-gray-300">
          {t('original')}
        </div>
        <div className="h-[calc(100%-2rem)]">
          <Editor
            value={store.originalText}
            language="plaintext"
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
            theme={isDark ? 'vs-dark' : 'vs'}
          />
        </div>
      </div>

      {/* Right Editor - Modified */}
      <div className="flex-1">
        <div className="h-8 bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] flex items-center px-3 text-sm text-gray-600 dark:text-gray-300">
          {t('modified')}
        </div>
        <div className="h-[calc(100%-2rem)]">
          <Editor
            value={store.modifiedText}
            language="plaintext"
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
            theme={isDark ? 'vs-dark' : 'vs'}
          />
        </div>
      </div>
    </div>
  )
})
