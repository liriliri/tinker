import { observer } from 'mobx-react-lite'
import {
  Clipboard,
  Trash2,
  ArrowLeftRight,
  GitCompare,
  PenLine,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()
  const iconSize = 14
  const isDiffMode = store.mode === 'diff'

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
        onClick={() => store.setMode('edit')}
        className={getModeButtonClass(store.mode === 'edit')}
        title={t('editMode')}
      >
        <PenLine size={iconSize} />
      </button>

      <button
        onClick={() => store.setMode('diff')}
        className={getModeButtonClass(store.mode === 'diff')}
        title={t('diffMode')}
      >
        <GitCompare size={iconSize} />
      </button>

      <div className="w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={() => store.swapTexts()}
        disabled={isDiffMode || store.isEmpty}
        className={actionButtonClass}
        title={t('swap')}
      >
        <ArrowLeftRight size={iconSize} />
      </button>

      <div className="w-px bg-[#e0e0e0] dark:bg-[#4a4a4a] mx-1" />

      <button
        onClick={() => store.pasteFromClipboard()}
        disabled={isDiffMode}
        className={actionButtonClass}
        title={t('paste')}
      >
        <Clipboard size={iconSize} />
      </button>

      <button
        onClick={() => store.clearText()}
        disabled={isDiffMode || store.isEmpty}
        className={actionButtonClass}
        title={t('clear')}
      >
        <Trash2 size={iconSize} />
      </button>
    </div>
  )
})
