import { observer } from 'mobx-react-lite'
import { ArrowLeftRight, GitCompare, PenLine, Eraser } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import store from '../store'
import { SUPPORTED_LANGUAGES } from '../lib/languageDetector'

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
    <div className="bg-[#f0f1f2] dark:bg-[#303133] border-b border-[#e0e0e0] dark:border-[#4a4a4a] dark:text-gray-200 px-1.5 py-1.5 flex gap-1 items-center justify-between">
      <div className="flex gap-1 items-center">
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

        <div className="w-px h-5 bg-[#d0d0d0] dark:bg-[#555555] mx-1.5" />

        <select
          value={store.language}
          onChange={(e) => store.setLanguage(e.target.value)}
          className="px-2 py-1 text-xs rounded bg-white dark:bg-[#3a3a3c] border border-[#d0d0d0] dark:border-[#555555] hover:border-[#0fc25e] dark:hover:border-[#0fc25e] transition-colors cursor-pointer focus:outline-none focus:border-[#0fc25e]"
          title={t('selectLanguage')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => store.swapTexts()}
          disabled={isDiffMode || store.isEmpty}
          className={actionButtonClass}
          title={t('swap')}
        >
          <ArrowLeftRight size={iconSize} />
        </button>

        <button
          onClick={() => store.clearText()}
          disabled={isDiffMode || store.isEmpty}
          className={actionButtonClass}
          title={t('clear')}
        >
          <Eraser size={iconSize} />
        </button>
      </div>

      {isDiffMode && (
        <div className="flex gap-3 text-xs mr-1">
          <span className="text-green-600 dark:text-green-400">
            +{store.diffStats.additions}
          </span>
          <span className="text-red-600 dark:text-red-400">
            -{store.diffStats.deletions}
          </span>
        </div>
      )}
    </div>
  )
})
