import { observer } from 'mobx-react-lite'
import { Toolbar, ToolbarButton } from 'share/components/Toolbar'
import store from '../store'

interface Tab {
  id: string
  label: string
}

interface ToolbarProps {
  tabs: Tab[]
}

export default observer(function ToolbarComponent({ tabs }: ToolbarProps) {
  return (
    <Toolbar className="py-0.5">
      {tabs.map((tab) => {
        const isActive = store.activeTab === tab.id
        return (
          <ToolbarButton
            key={tab.id}
            variant="toggle"
            active={isActive}
            className="h-6 px-2 py-0.5 flex items-center"
            onClick={() => store.setActiveTab(tab.id)}
          >
            <span className="text-xs leading-tight">{tab.label}</span>
          </ToolbarButton>
        )
      })}
    </Toolbar>
  )
})
