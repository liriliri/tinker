import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Download, CheckCircle2, ListX, Plus } from 'lucide-react'
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSpacer,
  ToolbarTextButton,
  TOOLBAR_ICON_SIZE,
} from 'share/components/Toolbar'
import store from '../store'
import { FilterTab } from '../types'

const tabs: { id: FilterTab; icon: typeof Download; label: string }[] = [
  { id: 'downloading', icon: Download, label: 'downloading' },
  { id: 'completed', icon: CheckCircle2, label: 'completed' },
]

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
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

      <ToolbarSeparator />

      <ToolbarButton
        title={t('clearCompleted')}
        disabled={!store.hasCompleted}
        onClick={() => store.clearCompleted()}
      >
        <ListX size={TOOLBAR_ICON_SIZE} />
      </ToolbarButton>
      <ToolbarSpacer />
      <ToolbarTextButton
        onClick={() => store.setAddModalVisible(true)}
        className="flex items-center gap-1"
      >
        <Plus size={TOOLBAR_ICON_SIZE} />
        {t('addDownloadTask')}
      </ToolbarTextButton>
    </Toolbar>
  )
})
