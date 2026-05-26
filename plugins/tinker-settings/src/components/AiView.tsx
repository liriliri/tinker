import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSearch,
  ToolbarSpacer,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import {
  Panel,
  Group,
  Separator,
  useDefaultLayout,
} from 'react-resizable-panels'
import AiSection from './AiSection'
import ProviderDetail from './ProviderDetail'

export default observer(function AiView() {
  const { t } = useTranslation()
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { defaultLayout, onLayoutChange } = useDefaultLayout({
    panelIds: ['list', 'detail'],
    id: 'tinker-settings-ai-layout',
    storage: localStorage,
  })

  return (
    <div className="h-full flex flex-col">
      <Toolbar>
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
                search={search}
                addOpen={addOpen}
                onAddClose={() => setAddOpen(false)}
              />
            </div>
          </Panel>
          <Separator />
          <Panel id="detail" minSize={200}>
            <div className="h-full overflow-hidden">
              <ProviderDetail />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  )
})
