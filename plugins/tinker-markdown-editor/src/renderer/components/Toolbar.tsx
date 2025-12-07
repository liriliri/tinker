import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import {
  Copy,
  Clipboard,
  Trash2,
  Undo,
  Redo,
  Check,
  FolderOpen,
  FilePlus,
  Save,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`

  const handleCopy = async () => {
    await store.copyToClipboard()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
      <button
        onClick={() => store.newFile()}
        className={actionButtonClass}
        title={t('newFile')}
      >
        <FilePlus size={iconSize} />
      </button>

      <button
        onClick={() => store.openFile()}
        className={actionButtonClass}
        title={t('openFile')}
      >
        <FolderOpen size={iconSize} />
      </button>

      <button
        onClick={() => store.saveFile()}
        disabled={store.isEmpty || !store.hasUnsavedChanges}
        className={actionButtonClass}
        title={t('save')}
      >
        <Save size={iconSize} />
      </button>

      <div className="w-px h-5 bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        className={actionButtonClass}
        title={t('undo')}
      >
        <Undo size={iconSize} />
      </button>

      <button
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        className={actionButtonClass}
        title={t('redo')}
      >
        <Redo size={iconSize} />
      </button>

      <div className="w-px h-5 bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={handleCopy}
        disabled={store.isEmpty}
        className={
          copied
            ? `${baseButtonClass} text-[#0fc25e] hover:bg-gray-200 dark:hover:bg-[#3a3a3c]`
            : actionButtonClass
        }
        title={t('copy')}
      >
        {copied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
      </button>

      <button
        onClick={() => store.pasteFromClipboard()}
        className={actionButtonClass}
        title={t('paste')}
      >
        <Clipboard size={iconSize} />
      </button>

      <button
        onClick={() => store.clearMarkdown()}
        disabled={store.isEmpty}
        className={actionButtonClass}
        title={t('clear')}
      >
        <Trash2 size={iconSize} />
      </button>

      <div className="flex-1" />

      {store.currentFileName && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-2 whitespace-nowrap">
          {store.currentFileName}
        </div>
      )}

      {store.lineCount > 0 && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-1 whitespace-nowrap">
          {t('lines', { count: store.lineCount })}
        </div>
      )}
    </div>
  )
})
