import { observer } from 'mobx-react-lite'
import { tw } from 'share/theme'
import className from 'licia/className'
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
    <div className={`flex gap-2 border-b ${tw.border.both}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => store.setActiveTab(tab.id)}
          className={className(
            'px-4 py-2 font-medium transition-colors',
            store.activeTab === tab.id
              ? [tw.primary.text, 'border-b-2', tw.primary.border]
              : [
                  'text-gray-600 dark:text-gray-400',
                  'hover:text-gray-900',
                  `dark:hover:${tw.text.dark.primary}`,
                ]
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
})
