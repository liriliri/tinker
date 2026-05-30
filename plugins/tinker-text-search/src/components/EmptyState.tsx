import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Search } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'

interface EmptyStateProps {
  variant: 'no-folder' | 'no-query' | 'no-results'
}

export default observer(function EmptyState({ variant }: EmptyStateProps) {
  const { t } = useTranslation()

  if (variant === 'no-folder') {
    return (
      <div
        onClick={() => store.pickFolder()}
        className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-6 ${tw.bg.tertiary} ${tw.hover}`}
      >
        <FolderOpen
          className={`w-10 h-10 mb-3 ${tw.gray.text400}`}
          strokeWidth={1.5}
        />
        <p className={`text-sm ${tw.text.primary}`}>{t('noFolder')}</p>
        <p className={`text-xs mt-1 ${tw.text.tertiary}`}>
          {t('openFolderHint')}
        </p>
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
