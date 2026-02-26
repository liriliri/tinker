import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FileText, FilePlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { tw } from 'share/theme'
import store from '../store'

interface WelcomeProps {
  onOpenFile: () => void
  onCreateFile: () => void
}

export default observer(function Welcome({
  onOpenFile,
  onCreateFile,
}: WelcomeProps) {
  const { t } = useTranslation()

  const handleOpenRecent = async (path: string) => {
    try {
      await store.setFilePath(path)
    } catch {
      toast.error(t('fileNotFound'))
    }
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
            onClick={onCreateFile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.tertiary} ${tw.hover} transition-colors border ${tw.border} ${tw.primary.hoverBorder}`}
          >
            <FilePlus size={20} className={tw.primary.text} />
            <span className="font-medium">{t('createFile')}</span>
          </button>

          <button
            onClick={onOpenFile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.tertiary} ${tw.hover} transition-colors border ${tw.border} ${tw.primary.hoverBorder}`}
          >
            <FileText size={20} className={tw.primary.text} />
            <span className="font-medium">{t('openFile')}</span>
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
