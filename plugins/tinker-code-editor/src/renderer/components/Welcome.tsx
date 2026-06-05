import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen } from 'lucide-react'
import Welcome from 'share/components/Welcome'
import type { WelcomeAction } from 'share/components/Welcome'
import store from '../store'

export default observer(function CodeEditorWelcome() {
  const { t } = useTranslation()

  const actions: WelcomeAction[] = [
    {
      icon: <FolderOpen size={20} />,
      label: t('openFolder'),
      onClick: () => store.openFolder(),
    },
  ]

  return (
    <Welcome
      title={t('welcomeTitle')}
      description={t('welcomeDescription')}
      actions={actions}
      recentFiles={store.recentDirectories}
      onOpenRecent={(path) => store.openRecentDirectory(path)}
      onRemoveRecent={(path) => store.removeRecentDirectory(path)}
    />
  )
})
