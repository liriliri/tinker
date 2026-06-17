import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FolderPlus,
  RotateCw,
} from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextInput,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { prompt } from 'share/components/Prompt'
import type ExplorerTab from '../store/ExplorerTab'
import store from '../store'

interface ExplorerToolbarProps {
  tab: ExplorerTab
}

export default observer(function ExplorerToolbar({
  tab,
}: ExplorerToolbarProps) {
  const { t } = useTranslation()

  const handleCreateFolder = async () => {
    const name = await prompt({
      title: t('newFolder'),
      message: t('newFolderPrompt'),
      placeholder: t('newFolderPlaceholder'),
    })
    if (!name?.trim()) return
    await store.createFolder(tab.id, name.trim())
  }

  return (
    <Toolbar>
      <ToolbarButton
        title={t('goBack')}
        disabled={!tab.canGoBack}
        onClick={() => void store.goBack(tab.id)}
      >
        <ArrowLeft size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('goForward')}
        disabled={!tab.canGoForward}
        onClick={() => void store.goForward(tab.id)}
      >
        <ArrowRight size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarButton
        title={t('goUp')}
        disabled={!tab.canGoUp}
        onClick={() => void store.goUp(tab.id)}
      >
        <ArrowUp size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton
        title={t('refresh')}
        onClick={() => void store.refreshTab(tab.id)}
      >
        <RotateCw
          size={TOOLBAR_ICON_SIZE}
          className={tab.loading ? 'animate-spin' : ''}
        />
      </ToolbarButton>
      <ToolbarButton
        title={t('newFolder')}
        onClick={() => void handleCreateFolder()}
      >
        <FolderPlus size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarTextInput
        value={store.pathInput}
        onChange={(e) => store.setPathInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void store.submitPathInput(tab.id)
        }}
        placeholder={t('pathPlaceholder')}
        className="max-w-xl flex-1"
      />
    </Toolbar>
  )
})
