import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FileText, FilePlus } from 'lucide-react'
import { tw } from 'share/theme'

interface WelcomeProps {
  onOpenFile: () => void
  onCreateFile: () => void
}

export default observer(function Welcome({
  onOpenFile,
  onCreateFile,
}: WelcomeProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`h-screen flex items-center justify-center ${tw.bg.secondary}`}
    >
      <div className="max-w-md w-full px-8">
        <div className="space-y-3">
          <button
            onClick={onCreateFile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.primary} ${tw.hover.both} transition-colors border ${tw.border}`}
          >
            <FilePlus size={20} />
            <span className="font-medium">{t('createFile')}</span>
          </button>

          <button
            onClick={onOpenFile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${tw.bg.primary} ${tw.hover.both} transition-colors border ${tw.border}`}
          >
            <FileText size={20} />
            <span className="font-medium">{t('openFile')}</span>
          </button>
        </div>
      </div>
    </div>
  )
})
