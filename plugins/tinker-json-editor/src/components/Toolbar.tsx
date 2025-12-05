import {
  AlignJustify,
  ChevronsLeft,
  Copy,
  Trash2,
  FileText,
  Network,
} from 'lucide-react'

type EditorMode = 'text' | 'tree'

interface ToolbarProps {
  onFormat: () => void
  onMinify: () => void
  onCopy: () => void
  onClear: () => void
  disabled: boolean
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
}

export default function Toolbar({
  onFormat,
  onMinify,
  onCopy,
  onClear,
  disabled,
  mode,
  onModeChange,
}: ToolbarProps) {
  const iconSize = 18

  const baseButtonClass = 'p-2 rounded transition-colors'
  const actionButtonClass = `${baseButtonClass} hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed`
  const getModeButtonClass = (isActive: boolean) =>
    `${baseButtonClass} ${
      isActive
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : 'hover:bg-gray-200'
    }`

  return (
    <div className="bg-gray-100 border-b border-gray-300 px-2 py-1 flex gap-1">
      <button
        onClick={() => onModeChange('text')}
        className={getModeButtonClass(mode === 'text')}
        title="Text Mode"
      >
        <FileText size={iconSize} />
      </button>

      <button
        onClick={() => onModeChange('tree')}
        className={getModeButtonClass(mode === 'tree')}
        title="Tree Mode"
      >
        <Network size={iconSize} />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <button
        onClick={onFormat}
        disabled={disabled || mode === 'tree'}
        className={actionButtonClass}
        title="Format JSON"
      >
        <AlignJustify size={iconSize} />
      </button>

      <button
        onClick={onMinify}
        disabled={disabled || mode === 'tree'}
        className={actionButtonClass}
        title="Minify JSON"
      >
        <ChevronsLeft size={iconSize} />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <button
        onClick={onCopy}
        disabled={disabled}
        className={actionButtonClass}
        title="Copy to clipboard"
      >
        <Copy size={iconSize} />
      </button>

      <button
        onClick={onClear}
        disabled={disabled}
        className={actionButtonClass}
        title="Clear all"
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  )
}
