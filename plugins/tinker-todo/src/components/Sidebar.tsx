import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { List, Calendar, Star, CheckCircle2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import className from 'licia/className'
import store, { FilterType } from '../store'
import { tw } from 'share/theme'

interface CategoryItem {
  id: FilterType
  icon: typeof List
  labelKey: string
  getCount: () => number
}

const getCategories = (): CategoryItem[] => [
  {
    id: 'all',
    icon: List,
    labelKey: 'all',
    getCount: () => store.stats.total,
  },
  {
    id: 'today',
    icon: Calendar,
    labelKey: 'today',
    getCount: () => store.stats.today,
  },
  {
    id: 'important',
    icon: Star,
    labelKey: 'important',
    getCount: () => store.stats.important,
  },
  {
    id: 'completed',
    icon: CheckCircle2,
    labelKey: 'completed',
    getCount: () => store.stats.completed,
  },
]

export default observer(function Sidebar() {
  const { t } = useTranslation()

  const handleClearCompleted = async () => {
    const confirmed = await confirm({
      title: t('clearCompletedConfirm'),
    })
    if (confirmed) {
      store.clearCompleted()
    }
  }

  return (
    <div
      className={`w-52 ${tw.bg.tertiary} border-r ${tw.border} flex flex-col flex-shrink-0`}
    >
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-0.5">
          {getCategories().map((category) => {
            const Icon = category.icon
            const isActive = store.currentFilter === category.id

            return (
              <button
                key={category.id}
                className={className(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                  isActive
                    ? [tw.primary.bg, 'text-white shadow-sm']
                    : [tw.hover.both, tw.text.both.primary]
                )}
                onClick={() => store.setCurrentFilter(category.id)}
              >
                <Icon size={16} />
                <span className="flex-1 text-left font-medium">
                  {t(category.labelKey)}
                </span>
                <span
                  className={className(
                    'text-xs font-semibold tabular-nums min-w-[20px] text-right',
                    isActive ? 'opacity-70' : tw.text.both.secondary
                  )}
                >
                  {category.getCount()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className={`p-3 border-t ${tw.border}`}>
        <button
          className={`w-full px-3 py-1.5 text-xs ${tw.text.both.secondary} ${tw.hover.both} rounded-md transition-colors`}
          onClick={handleClearCompleted}
        >
          {t('clearCompleted')}
        </button>
      </div>
    </div>
  )
})
