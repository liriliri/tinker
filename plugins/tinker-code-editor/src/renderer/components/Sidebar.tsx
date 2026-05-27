import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { tw } from 'share/theme'
import store from '../store'
import FileTree from './FileTree'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  if (!store.sidebarOpen) return null

  return (
    <div className={`relative z-10 h-full flex flex-col ${tw.bg.tertiary}`}>
      <div className="flex-1 overflow-y-auto">
        {store.rootPath ? (
          <FileTree />
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <button
              type="button"
              onClick={() => store.openFolder()}
              className={`px-3 py-1.5 text-xs rounded border ${tw.border} ${tw.hover} ${tw.text.secondary}`}
            >
              {t('noFolderOpened')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
