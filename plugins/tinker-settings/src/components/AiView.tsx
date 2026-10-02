import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarButtonGroup,
  ToolbarSearch,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import { Panel, Group, Separator } from 'react-resizable-panels'
import { useDefaultLayout } from 'share/hooks/useDefaultLayout'
import store from '../store'
import type { AiMode } from '../types'
import AiSection from './AiSection'
import ProviderDetail from './ProviderDetail'

export default observer(function AiView() {
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['list', 'detail'],
  })

  const handleModeChange = (mode: AiMode) => {
    if (store.aiMode === mode) return
    store.setAiMode(mode)
    setSearch('')
    setAddOpen(false)
  }

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
        <ToolbarButtonGroup>
          <ToolbarButton
            variant="toggle"
            active={store.aiMode === 'chat'}
            onClick={() => handleModeChange('chat')}
            className="h-6 px-2 py-0.5 flex items-center"
          >
            <span className="text-xs leading-tight">{t('aiChat')}</span>
          </ToolbarButton>
          <ToolbarButton
            variant="toggle"
            active={store.aiMode === 'image'}
            onClick={() => handleModeChange('image')}
            className="h-6 px-2 py-0.5 flex items-center"
          >
            <span className="text-xs leading-tight">{t('aiImage')}</span>
          </ToolbarButton>
        </ToolbarButtonGroup>
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder={t('search')}
        />
        <ToolbarSpacer />
        <ToolbarButton
          onClick={() => setAddOpen(true)}
          title={t('addProvider')}
        >
          <Plus size={TOOLBAR_ICON_SIZE} />
        </ToolbarButton>
      </Toolbar>

      <div className="flex-1 overflow-hidden">
        <Group
          orientation="horizontal"
          className="h-full"
          defaultLayout={defaultLayout}
          onLayoutChange={onLayoutChange}
        >
          <Panel id="list" minSize={200}>
            <div className="h-full overflow-hidden">
              <AiSection
                mode={store.aiMode}
                search={search}
                addOpen={addOpen}
                onAddClose={() => setAddOpen(false)}
              />
            </div>
          </Panel>
          <Separator />
          <Panel id="detail" minSize={200}>
            <div className="h-full overflow-hidden">
              <ProviderDetail mode={store.aiMode} />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  )
})
