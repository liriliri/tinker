import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search, X, Folder, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  Toolbar,
  ToolbarSeparator,
  ToolbarTextInput,
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

      <div className="relative w-48 ml-2">
        <Search
          size={14}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary}`}
        />
        <ToolbarTextInput
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`w-full pl-7 pr-7 py-1 ${tw.bg.input} ${tw.primary.focusBorder} placeholder:${tw.text.tertiary} dark:placeholder:${tw.text.tertiary}`}
        />
        {store.searchQuery && (
          <button
            onClick={() => store.setSearchQuery('')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.tertiary} hover:${tw.text.primary}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

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
