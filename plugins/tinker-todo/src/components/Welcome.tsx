import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FileText, FilePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Welcome from 'share/components/Welcome'
import store from '../store'
import type { WelcomeAction } from 'share/components/Welcome'

interface WelcomeProps {
  onOpenFile: () => void
  onCreateFile: () => void
}

export default observer(function TodoWelcome({
  onOpenFile,
  onCreateFile,
}: WelcomeProps) {
  const { t } = useTranslation()

  const actions: WelcomeAction[] = [
    {
      icon: <FilePlus size={20} />,
      label: t('createFile'),
      onClick: onCreateFile,
    },
    {
      icon: <FileText size={20} />,
      label: t('openFile'),
      onClick: onOpenFile,
    },
  ]

  const handleOpenRecent = async (path: string) => {
    try {
      await store.setFilePath(path)
    } catch {
      toast.error(t('fileNotFound'))
    }
  }

  return (
    <Welcome
      title={t('welcomeTitle')}
      description={t('welcomeDescription')}
      actions={actions}
      recentFiles={store.recentFiles}
      onOpenRecent={handleOpenRecent}
      onRemoveRecent={(path) => store.removeRecentFile(path)}
    />
  )
})
