import { observer } from 'mobx-react-lite'
import { Plus } from 'lucide-react'
import { tw } from 'share/theme'
import store from '../store'
import Tab from './Tab'

export default observer(function TabBar() {
  return (
    <div
      className={`relative flex items-center ${tw.bg.secondary} h-[38px] min-h-[38px]`}
    >
      <div className="flex items-end overflow-x-hidden min-w-0 h-full pt-[4px]">
        {store.tabs.map((tab, i) => {
          const nextTab = store.tabs[i + 1]
          const isActive = tab.id === store.activeTabId
          const nextIsActive = nextTab?.id === store.activeTabId
          const isLast = i === store.tabs.length - 1
          const showSep = !isLast && !isActive && !nextIsActive

          return (
            <Tab
              key={tab.id}
              tab={tab}
              isFirst={i === 0}
              showSeparator={showSep}
            />
          )
        })}
      </div>
      <button
        className={`p-1 mx-1.5 rounded-md flex-shrink-0 ${tw.hover} transition-colors`}
        onClick={() => store.addTab()}
      >
        <Plus size={14} className={tw.text.secondary} />
      </button>
      <div
        className={`absolute bottom-0 left-0 right-0 h-px ${tw.bg.border}`}
      />
    </div>
  )
})
