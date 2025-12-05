import { observer } from 'mobx-react-lite'
import {
  AlignJustify,
  ChevronsLeft,
  Copy,
  Trash2,
  FileText,
  Network,
  ChevronDown,
  ChevronRight,
  Undo,
  Redo,
} from 'lucide-react'
import store from '../store'

export default observer(function Toolbar() {
  const iconSize = 14

  const baseButtonClass = 'p-1.5 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-[#3a3a3c] disabled:opacity-30 disabled:cursor-not-allowed`
  const getModeButtonClass = (isActive: boolean) =>
    `${baseButtonClass} ${
      isActive
        ? 'bg-[#0fc25e] text-white hover:bg-[#0db054]'
        : 'hover:bg-gray-200 dark:hover:bg-[#3a3a3c]'
    }`

  return (
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1">
      <button
        onClick={() => store.setMode('text')}
        className={getModeButtonClass(store.mode === 'text')}
        title="Text Mode"
      >
        <FileText size={iconSize} />
      </button>

      <button
        onClick={() => store.setMode('tree')}
        className={getModeButtonClass(store.mode === 'tree')}
        title="Tree Mode"
      >
        <Network size={iconSize} />
      </button>

      <div className="w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={() => store.undo()}
        disabled={!store.canUndo}
        className={actionButtonClass}
        title="Undo"
      >
        <Undo size={iconSize} />
      </button>

      <button
        onClick={() => store.redo()}
        disabled={!store.canRedo}
        className={actionButtonClass}
        title="Redo"
      >
        <Redo size={iconSize} />
      </button>

      <div className="w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      {store.mode === 'text' ? (
        <>
          <button
            onClick={() => store.formatJson()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title="Format JSON"
          >
            <AlignJustify size={iconSize} />
          </button>

          <button
            onClick={() => store.minifyJson()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title="Minify JSON"
          >
            <ChevronsLeft size={iconSize} />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => store.expandAll()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title="Expand All"
          >
            <ChevronDown size={iconSize} />
          </button>

          <button
            onClick={() => store.collapseAll()}
            disabled={store.isEmpty}
            className={actionButtonClass}
            title="Collapse All"
          >
            <ChevronRight size={iconSize} />
          </button>
        </>
      )}

      <div className="w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={() => store.copyToClipboard()}
        disabled={store.isEmpty}
        className={actionButtonClass}
        title="Copy to clipboard"
      >
        <Copy size={iconSize} />
      </button>

      <button
        onClick={() => store.clearJson()}
        disabled={store.isEmpty}
        className={actionButtonClass}
        title="Clear all"
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  )
})
