import { observer } from 'mobx-react-lite'
import {
  AlignJustify,
  ChevronsLeft,
  Copy,
  Trash2,
  FileText,
  Network,
} from 'lucide-react'
import store from '../store'

export default observer(function Toolbar() {
  const iconSize = 18

  const baseButtonClass = 'p-2 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed`
  const getModeButtonClass = (isActive: boolean) =>
    `${baseButtonClass} ${
      isActive
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
    }`

  return (
    <div className="bg-gray-100 dark:bg-[#2d2d2d] border-b border-gray-300 dark:border-gray-700 dark:text-gray-200 px-2 py-1 flex gap-1">
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

      <div className="w-px bg-gray-300 mx-1" />

      <button
        onClick={() => store.formatJson()}
        disabled={store.isEmpty || store.mode === 'tree'}
        className={actionButtonClass}
        title="Format JSON"
      >
        <AlignJustify size={iconSize} />
      </button>

      <button
        onClick={() => store.minifyJson()}
        disabled={store.isEmpty || store.mode === 'tree'}
        className={actionButtonClass}
        title="Minify JSON"
      >
        <ChevronsLeft size={iconSize} />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

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
