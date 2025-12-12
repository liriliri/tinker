import { observer } from 'mobx-react-lite'
import store from '../store'

interface Tab {
  id: string
  label: string
}

interface TabNavProps {
  tabs: Tab[]
}

export default observer(function TabNav({ tabs }: TabNavProps) {
  return (
    <div className="flex gap-2 border-b border-[#e0e0e0] dark:border-[#4a4a4a]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => store.setActiveTab(tab.id)}
          className={`px-4 py-2 font-medium transition-colors ${
            store.activeTab === tab.id
              ? 'text-[#0fc25e] border-b-2 border-[#0fc25e]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-[#d4d4d4]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
})
