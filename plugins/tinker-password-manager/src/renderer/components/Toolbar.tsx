import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Save, Lock, Plus, FolderPlus, Search, Folder } from 'lucide-react'
import {
  Toolbar as ToolbarComponent,
  ToolbarSeparator,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { ToolbarButton } from 'share/components/ToolbarButton'
import { tw } from 'share/theme'
import store from '../store'
import { prompt } from 'share/components/Prompt'

export default observer(function Toolbar() {
  const { t } = useTranslation()

  const handleSave = async () => {
    await store.saveDatabase()
  }

  const handleLock = () => {
    store.lockDatabase()
  }

  const handleNewEntry = async () => {
    if (!store.selectedGroupId) return

    const title = await prompt({
      title: t('newEntry'),
      defaultValue: 'New Entry',
    })

    if (!title) return

    store.createEntry(store.selectedGroupId, title)
  }

  const handleNewGroup = async () => {
    if (!store.selectedGroupId) return

    const name = await prompt({
      title: t('newGroup'),
      defaultValue: 'New Group',
    })

    if (!name) return

    store.createGroup(store.selectedGroupId, name)
  }

  const handleShowInFolder = () => {
    if (store.dbPath) {
      tinker.showItemInPath(store.dbPath)
    }
  }

  return (
    <ToolbarComponent>
      <ToolbarButton
        onClick={handleShowInFolder}
        disabled={!store.dbPath}
        title={t('showInFolder')}
      >
        <Folder size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleSave}
        disabled={!store.isModified}
        title={t('saveDatabase')}
      >
        <Save size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={handleNewEntry}
        disabled={!store.selectedGroupId}
        title={t('createEntry')}
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarButton
        onClick={handleNewGroup}
        disabled={!store.selectedGroupId}
        title={t('createGroup')}
      >
        <FolderPlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>

      <ToolbarSeparator />

      <div className="relative w-48">
        <Search
          size={14}
          className={`absolute left-2 top-1/2 -translate-y-1/2 ${tw.text.both.tertiary}`}
        />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          className={`w-full pl-7 pr-2 py-1 text-xs border rounded ${tw.border.both} ${tw.bg.both.input} ${tw.text.both.primary} focus:outline-none ${tw.primary.focusBorder} placeholder:${tw.text.light.tertiary} dark:placeholder:${tw.text.dark.tertiary}`}
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ToolbarButton onClick={handleLock} title={t('lockDatabase')}>
          <Lock size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </div>
    </ToolbarComponent>
  )
})
