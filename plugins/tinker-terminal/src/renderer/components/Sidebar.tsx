import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { PanelLeftClose, FolderPlus } from 'lucide-react'
import { tw } from 'share/theme'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { prompt } from 'share/components/Prompt'
import store from '../store'
import SessionTree from './SessionTree'

export default observer(function Sidebar() {
  const { t } = useTranslation()
  const isVisible = store.sidebarOpen
  const [filter, setFilter] = useState('')

  const handleCreateFolder = async () => {
    const name = await prompt({
      title: t('newFolder'),
      defaultValue: '',
      placeholder: t('newFolder'),
    })
    if (name) {
      store.createFolder(name)
    }
  }

  return (
    <div
      className={`
        w-56 h-full flex flex-col
        ${tw.bg.tertiary}
        transition-all duration-200
        ${isVisible ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        flexShrink: 0,
        marginLeft: isVisible ? 0 : -224,
      }}
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
        <ToolbarButton
          onClick={() => store.toggleSidebar()}
          title={t('hideSidebar')}
        >
          <PanelLeftClose size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>
      <div className={`flex-1 overflow-hidden border-r ${tw.border}`}>
        <SessionTree filter={filter} />
      </div>
    </div>
  )
})
