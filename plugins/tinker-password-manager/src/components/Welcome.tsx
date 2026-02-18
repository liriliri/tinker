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

  return (
    <div
      className={`h-screen flex items-center justify-center ${tw.bg.secondary}`}
    >
      <div className="max-w-md w-full px-8">
        <div className="space-y-3 mb-8">
          <button
            onClick={handleNewDatabase}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.primary} ${tw.hover.both} transition-colors border ${tw.border}`}
          >
            <Plus size={20} />
            <span className="font-medium">{t('newDatabase')}</span>
          </button>

          <button
            onClick={handleOpenDatabase}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.primary} ${tw.hover.both} transition-colors border ${tw.border}`}
          >
            <FolderOpen size={20} />
            <span className="font-medium">{t('openDatabase')}</span>
          </button>
        </div>

        {store.recentFiles.length > 0 && (
          <div>
            <h2
              className={`text-sm font-medium mb-2 ${tw.text.both.secondary}`}
            >
              {t('recentFiles')}
            </h2>
            <div className="space-y-1">
              {store.recentFiles.map((path) => (
                <button
                  key={path}
                  onClick={() => handleOpenRecent(path)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${tw.bg.primary} ${tw.hover.both} transition-colors truncate border ${tw.border}`}
                >
                  {path.split('/').pop()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})
