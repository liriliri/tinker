import { useTranslation } from 'react-i18next'
import FolderOpen from 'share/components/FolderOpen'
import store from '../store'

export default function FolderOpenView() {
  const { t } = useTranslation()

  return (
    <FolderOpen
      onOpenFolder={(path) => store.openDirectory(path)}
      openTitle={t('openFolder')}
      dropTitle={t('dropFolderHere')}
    />
  )
}
