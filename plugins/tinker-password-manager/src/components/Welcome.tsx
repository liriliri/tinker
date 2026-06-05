import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Plus } from 'lucide-react'
import Welcome from 'share/components/Welcome'
import store from '../store'
import { prompt } from 'share/components/Prompt'
import { alert } from 'share/components/Alert'
import type { WelcomeAction } from 'share/components/Welcome'

export default observer(function PwdMgrWelcome() {
  const { t } = useTranslation()

  const handleNewDatabase = async () => {
    const name = await prompt({
      title: t('newDatabase'),
      defaultValue: 'My Database',
    })

    if (!name) return

    const password = await prompt({
      title: t('masterPassword'),
      inputType: 'password',
    })

    if (!password) return

    const confirmPwd = await prompt({
      title: t('confirmPassword'),
      inputType: 'password',
    })

    if (password !== confirmPwd) {
      alert({ title: t('passwordMismatch') })
      return
    }

    await store.createDatabase(name, password)
  }

  const handleOpenDatabase = async () => {
    const result = await tinker.showOpenDialog({
      filters: [{ name: 'KeePass Database', extensions: ['kdbx'] }],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return
    }

    const filePath = result.filePaths[0]

    const password = await prompt({
      title: t('masterPassword'),
      inputType: 'password',
    })

    if (!password) return

    await store.openDatabase(filePath, password)
  }

  const handleOpenRecent = async (path: string) => {
    const password = await prompt({
      title: t('masterPassword'),
      inputType: 'password',
    })

    if (!password) return

    await store.openDatabase(path, password)
  }

  const actions: WelcomeAction[] = [
    {
      icon: <Plus size={20} />,
      label: t('newDatabase'),
      onClick: handleNewDatabase,
    },
    {
      icon: <FolderOpen size={20} />,
      label: t('openDatabase'),
      onClick: handleOpenDatabase,
    },
  ]

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
