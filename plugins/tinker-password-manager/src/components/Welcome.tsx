import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Plus } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import { prompt } from 'share/components/Prompt'
import { alert } from 'share/components/Alert'

export default observer(function Welcome() {
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

  const handleContextMenu = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    tinker.showContextMenu(e.clientX, e.clientY, [
      { label: t('open'), click: () => handleOpenRecent(path) },
      { label: t('showInFolder'), click: () => tinker.showItemInPath(path) },
      { type: 'separator' },
      {
        label: t('removeFromRecent'),
        click: () => store.removeRecentFile(path),
      },
    ])
  }

  return (
    <div
      className={`h-screen flex items-center justify-center ${tw.bg.secondary}`}
    >
      <div className="max-w-md w-full px-8">
        <div className="mb-8 text-center">
          <h1 className={`text-2xl font-bold mb-2 ${tw.text.primary}`}>
            {t('welcomeTitle')}
          </h1>
          <p className={`text-sm ${tw.text.secondary}`}>
            {t('welcomeDescription')}
          </p>
        </div>
        <div className="space-y-3 mb-8">
          <button
            onClick={handleNewDatabase}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.tertiary} ${tw.hover} transition-colors border ${tw.border} ${tw.primary.hoverBorder}`}
          >
            <Plus size={20} className={tw.primary.text} />
            <span className="font-medium">{t('newDatabase')}</span>
          </button>

          <button
            onClick={handleOpenDatabase}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.tertiary} ${tw.hover} transition-colors border ${tw.border} ${tw.primary.hoverBorder}`}
          >
            <FolderOpen size={20} className={tw.primary.text} />
            <span className="font-medium">{t('openDatabase')}</span>
          </button>
        </div>

        {store.recentFiles.length > 0 && (
          <div className={`border ${tw.border} rounded-lg overflow-hidden`}>
            {store.recentFiles.map((path) => (
              <button
                key={path}
                onClick={() => handleOpenRecent(path)}
                onContextMenu={(e) => handleContextMenu(e, path)}
                className={`w-full text-left px-2 py-1 ${tw.bg.primary} ${tw.hover} transition-colors`}
              >
                <div className={`text-sm font-medium ${tw.text.primary}`}>
                  {path.split('/').pop()}
                </div>
                <div className={`text-xs mt-0.5 ${tw.text.tertiary} truncate`}>
                  {path}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})
