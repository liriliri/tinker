import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search, X, FolderOpen, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Toolbar, TOOLBAR_ICON_SIZE } from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleSelectFile = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result && result.filePaths && result.filePaths.length > 0) {
      await store.setFilePath(result.filePaths[0])
    }
  }

  const handleReload = async () => {
    await store.reloadTodos()
    toast.success(t('reloadSuccess'))
  }

  return (
    <Toolbar>
      <ToolbarButton onClick={handleSelectFile} title={t('selectFile')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton onClick={handleReload} title={t('reload')}>
        <RefreshCw size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <div className="relative w-48 ml-2">
        <Search
          size={14}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.both.tertiary}`}
        />
        <input
          type="text"
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`w-full pl-7 pr-7 py-1 text-xs border rounded ${tw.border.both} ${tw.bg.both.input} ${tw.text.both.primary} focus:outline-none ${tw.primary.focusBorder} placeholder:${tw.text.light.tertiary} dark:placeholder:${tw.text.dark.tertiary}`}
        />
        {store.searchQuery && (
          <button
            onClick={() => store.setSearchQuery('')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 ${tw.text.both.tertiary} hover:${tw.text.both.primary}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Checkbox
          checked={store.showCompleted}
          onChange={(checked) => store.setShowCompleted(checked)}
        >
          <span className={tw.text.both.secondary}>{t('showCompleted')}</span>
        </Checkbox>
      </div>
    </Toolbar>
  )
})
