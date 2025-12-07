import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import {
  AlignJustify,
  Copy,
  Clipboard,
  Trash2,
  FileText,
  Network,
  Undo,
  Redo,
  Check,
  FolderOpen,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import ExpandIcon from '../assets/expand.svg?react'
import CollapseIcon from '../assets/collapse.svg?react'
import MinifyIcon from '../assets/minify.svg?react'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const [copied, setCopied] = useState(false)

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`
  const getModeButtonClass = (isActive: boolean) =>
    `${baseButtonClass} ${
      isActive
        ? 'bg-[#0fc25e] text-white hover:bg-[#0db054]'
        : 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
    }`

  const handleCopy = async () => {
    await store.copyToClipboard()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center">
      <button
        onClick={() => store.setMode('text')}
        className={getModeButtonClass(store.mode === 'text')}
        title={t('textMode')}
      >
        <FileText size={iconSize} />
      </button>

      <button
        onClick={() => store.setMode('tree')}
        className={getModeButtonClass(store.mode === 'tree')}
        title={t('treeMode')}
      >
        <Network size={iconSize} />
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

      {store.mode === 'text' ? (
        <>
          <button
            onClick={() => store.formatJson()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title={t('format')}
          >
            <AlignJustify size={iconSize} />
          </button>

          <button
            onClick={() => store.minifyJson()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title={t('minify')}
          >
            <MinifyIcon
              width={iconSize}
              height={iconSize}
              className="fill-current"
            />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => store.expandAll()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title={t('expandAll')}
          >
            <ExpandIcon
              width={iconSize}
              height={iconSize}
              className="fill-current"
            />
          </button>

          <button
            onClick={() => store.collapseAll()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title={t('collapseAll')}
          >
            <CollapseIcon
              width={iconSize}
              height={iconSize}
              className="fill-current"
            />
          </button>
        </>
      )}

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
        onClick={() => store.openFile()}
        className={actionButtonClass}
        title={t('openFile')}
      >
        <FolderOpen size={iconSize} />
      </button>

      <button
        onClick={() => store.clearJson()}
        disabled={store.isEmpty}
        className={actionButtonClass}
        title={t('clear')}
      >
        <Trash2 size={iconSize} />
      </button>

      {store.jsonError && (
        <div
          className="text-red-600 dark:text-red-400 ml-1"
          title={store.jsonError}
        >
          <AlertCircle size={16} />
        </div>
      )}

      <div className="flex-1" />

      {store.lineCount > 0 && (
        <div className="text-gray-600 dark:text-gray-400 text-xs mr-1 whitespace-nowrap">
          {t('lines', { count: store.lineCount })}
        </div>
      )}
    </div>
  )
})
