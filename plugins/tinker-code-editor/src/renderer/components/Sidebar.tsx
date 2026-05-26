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
          <div className={`p-4 text-xs text-center ${tw.text.tertiary}`}>
            {t('noFolderOpened')}
          </div>
        )}
      </div>
    </div>
  )
})
