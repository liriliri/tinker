import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X, Folder, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
  ToolbarButton,
} from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleReload = async () => {
    await store.loadTodos()
    toast.success(t('reloadSuccess'))
  }

  const handleShowInFolder = () => {
    if (store.filePath) {
      tinker.showItemInPath(store.filePath)
    }
  }

  const handleClose = () => {
    store.closeFile()
  }

  return (
    <Toolbar>
      <ToolbarButton
        onClick={handleShowInFolder}
        title={t('showInFolder')}
        disabled={!store.filePath}
      >
        <Folder size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handleReload} title={t('reload')}>
        <RefreshCw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarSearch
        value={store.searchQuery}
        onChange={(value) => store.setSearchQuery(value)}
        placeholder={t('searchPlaceholder')}
      />

      <Checkbox
        checked={store.showCompleted}
        onChange={(checked) => store.setShowCompleted(checked)}
      >
        <span className={tw.text.secondary}>{t('showCompleted')}</span>
      </Checkbox>

      <div className="ml-auto">
        <ToolbarButton onClick={handleClose} title={t('close')}>
          <X size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>
    </Toolbar>
  )
})
