import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FilePlus, FolderPlus, Trash2, X } from 'lucide-react'
import {
  Toolbar as SharedToolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'
import toast from 'react-hot-toast'
import store from '../store'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const handleClear = async () => {
    if (store.files.length === 0) return
    const ok = await confirm({
      title: t('confirmClear'),
      message: t('confirmClearMessage'),
    })
    if (ok) store.clearFiles()
  }

  const handleRename = async () => {
    const changeCount = store.previews.filter((p) => p.changed).length
    const ok = await confirm({
      title: t('confirmRename'),
      message: t('confirmRenameMessage', { count: changeCount }),
    })
    if (!ok) return

    const result = await store.executeRename()
    if (!result) return
    if (result.success > 0) {
      toast.success(t('renameSuccess', { count: result.success }))
      store.clearFiles()
    }
    if (result.errors.length > 0) {
      toast.error(t('renameErrors', { count: result.errors.length }))
    }
  }

  return (
    <SharedToolbar className="py-0.5">
      <ToolbarButton onClick={() => store.addFiles()} title={t('addFiles')}>
        <FilePlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton onClick={() => store.addDir()} title={t('addFolder')}>
        <FolderPlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        onClick={() => store.removeSelected()}
        disabled={store.selectedFile === null}
        title={t('removeSelected')}
      >
        <Trash2 size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleClear}
        disabled={store.files.length === 0}
        title={t('clearAll')}
      >
        <X size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarTextButton
        onClick={handleRename}
        disabled={store.renaming || !store.hasChanges}
      >
        {store.renaming ? t('renaming') : t('execute')}
      </ToolbarTextButton>
    </SharedToolbar>
  )
})
