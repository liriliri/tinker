import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { FolderPlus } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import OverlayScrollbars from 'share/components/OverlayScrollbars'
import { prompt } from 'share/components/Prompt'
import store from '../store'
import SessionTree from './SessionTree'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')

  const handleCreateFolder = async () => {
    const name = await prompt({
      title: t('newFolder'),
      defaultValue: '',
      placeholder: t('newFolder'),
    })
    if (name) {
      store.createSessionFolder(name)
    }
  }

  if (!store.sidebarOpen) return null

  return (
    <div
      className={`w-56 h-full flex flex-col flex-shrink-0 border-r ${tw.border} ${tw.bg.tertiary}`}
    >
      <Toolbar>
        <ToolbarSearch
          value={filter}
          onChange={setFilter}
          placeholder={t('searchSession')}
          className="flex-1 ml-0"
        />
        <ToolbarButton onClick={handleCreateFolder} title={t('newFolder')}>
          <FolderPlus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <OverlayScrollbars defer className="relative min-h-0 flex-1">
        <div className="absolute inset-0 flex flex-col">
          <SessionTree filter={filter} />
        </div>
      </OverlayScrollbars>
    </div>
  )
})
