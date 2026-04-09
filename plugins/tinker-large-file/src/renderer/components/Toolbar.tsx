import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  FolderOpen,
  AlignJustify,
  Music,
  Video,
  FileText,
  Image,
  File,
} from 'lucide-react'
import {
  Toolbar as ToolbarBase,
  ToolbarButton,
  ToolbarSpacer,
  ToolbarSeparator,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { confirm } from 'share/components/Confirm'
import toast from 'react-hot-toast'
import fileSize from 'licia/fileSize'
import { tw } from 'share/theme'
import store from '../store'
import type { FilterTab } from '../types'

const tabs: { id: FilterTab; icon: typeof AlignJustify; label: string }[] = [
  { id: 'all', icon: AlignJustify, label: 'all' },
  { id: 'audio', icon: Music, label: 'audio' },
  { id: 'video', icon: Video, label: 'video' },
  { id: 'document', icon: FileText, label: 'document' },
  { id: 'image', icon: Image, label: 'image' },
  { id: 'other', icon: File, label: 'other' },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  const handleOpenFolder = async () => {
    const result = await tinker.showOpenDialog({
      properties: ['openDirectory'],
    })
    const [dirPath] = result.filePaths
    if (result.canceled || !dirPath) return

    store.reset()
    store.openDirectory(dirPath)
  }

  const handleClean = async () => {
    if (store.selectedCount === 0) return
    const ok = await confirm({
      title: t('confirmClean'),
      message: t('confirmCleanMessage', {
        count: store.selectedCount,
        size: fileSize(store.selectedSize),
      }),
    })
    if (!ok) return

    const result = await store.deleteSelected()
    if (!result) return
    if (result.deleted > 0) {
      toast.success(t('cleanSuccess', { count: result.deleted }))
    }
    if (result.errors.length > 0) {
      toast.error(t('cleanErrors', { count: result.errors.length }))
    }
    store.reset()
  }

  return (
    <ToolbarBase>
      <ToolbarButton onClick={handleOpenFolder} title={t('openFolder2')}>
        <FolderOpen size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      {store.view === 'result' && (
        <>
          <ToolbarSeparator />
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = store.filterTab === tab.id
            return (
              <ToolbarButton
                key={tab.id}
                variant="toggle"
                active={isActive}
                onClick={() => store.setFilterTab(tab.id)}
                className="px-2 py-1 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={TOOLBAR_ICON_SIZE} />
                  {t(tab.label)}
                </div>
              </ToolbarButton>
            )
          })}
        </>
      )}
      <ToolbarSpacer />
      {store.view === 'result' && (
        <span className={`text-xs ${tw.text.secondary} mr-2`}>
          {store.selectedCount > 0
            ? t('selectedInfo', {
                count: store.selectedCount,
                size: fileSize(store.selectedSize),
              })
            : t('largeFiles', { count: store.filteredFiles.length })}
        </span>
      )}
      <ToolbarTextButton
        onClick={handleClean}
        disabled={store.selectedCount === 0}
      >
        {t('clean')}
      </ToolbarTextButton>
    </ToolbarBase>
  )
})
