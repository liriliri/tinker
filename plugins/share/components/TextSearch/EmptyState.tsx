import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Search } from 'lucide-react'
import { tw } from '../../theme'
import { useTextSearchContext } from './context'
import { TEXT_SEARCH_NS } from './namespace'

interface EmptyStateProps {
  variant: 'no-folder' | 'no-query' | 'no-results'
}

export default observer(function EmptyState({ variant }: EmptyStateProps) {
  const { t } = useTranslation(TEXT_SEARCH_NS)
  const { search, showFolderPicker = true } = useTextSearchContext()

  if (variant === 'no-folder') {
    if (!showFolderPicker) {
      return (
        <div
          className={`flex-1 flex flex-col items-center justify-center p-6 ${tw.bg.tertiary}`}
        >
          <FolderOpen
            className={`w-10 h-10 mb-3 ${tw.gray.text400}`}
            strokeWidth={1.5}
          />
          <p className={`text-sm ${tw.text.primary}`}>{t('noFolder')}</p>
        </div>
      )
    }
    return (
      <div
        className={`flex-1 flex items-center justify-center p-4 ${tw.bg.tertiary}`}
      >
        <button
          type="button"
          onClick={() => search.pickFolder()}
          className={`px-3 py-1.5 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.secondary}`}
        >
          {t('pickFolder')}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center p-6 ${tw.bg.tertiary}`}
    >
      <Search className={`w-8 h-8 mb-2 ${tw.gray.text400}`} strokeWidth={1.5} />
      <p className={`text-xs ${tw.text.tertiary}`}>
        {variant === 'no-query' ? t('noQuery') : t('noResults')}
      </p>
    </div>
  )
})
