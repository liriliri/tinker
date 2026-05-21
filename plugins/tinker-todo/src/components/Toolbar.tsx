import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { X, Folder, RefreshCw, PictureInPicture2 } from 'lucide-react'
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
import { openPopupWindow } from 'share/lib/popupWindow'
import store from '../store'
import FloatTodos from './FloatTodos'

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

  const handleFloatToday = () => {
    if (store.popupWindow && !store.popupWindow.closed) {
      store.popupWindow.focus()
      return
    }
    const popup = openPopupWindow(
      {
        width: 320,
        height: 300,
        minWidth: 240,
        minHeight: 150,
        positionKey: 'todo',
      },
      (_popup, onClose) => <FloatTodos onClose={onClose} />
    )
    store.popupWindow = popup
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
        <ToolbarButton onClick={handleFloatToday} title={t('floatToday')}>
          <PictureInPicture2 size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
        <ToolbarButton onClick={handleClose} title={t('close')}>
          <X size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>
    </Toolbar>
  )
})
