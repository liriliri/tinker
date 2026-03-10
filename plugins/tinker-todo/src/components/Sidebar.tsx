import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { List, Calendar, Star, CheckCircle2 } from 'lucide-react'
import { confirm } from 'share/components/Confirm'
import NavList, { type NavListItem } from 'share/components/NavList'
import store from '../store'
import { type FilterType } from '../types'
import { tw } from 'share/theme'

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

  const items: NavListItem[] = [
    {
      id: 'all',
      icon: List,
      label: t('all'),
      count: store.stats.total,
    },
    {
      id: 'today',
      icon: Calendar,
      label: t('today'),
      count: store.stats.today,
    },
    {
      id: 'important',
      icon: Star,
      label: t('important'),
      count: store.stats.important,
    },
    {
      id: 'completed',
      icon: CheckCircle2,
      label: t('completed'),
      count: store.stats.completed,
    },
  ]

  return (
    <div
      className={`w-52 ${tw.bg.tertiary} border-r ${tw.border} flex flex-col flex-shrink-0`}
    >
      <div className="flex-1 overflow-y-auto">
        <NavList
          items={items}
          activeId={store.currentFilter as string}
          onSelect={(id) => store.setCurrentFilter(id as FilterType)}
        />
      </div>

      <div className={`p-3 border-t ${tw.border}`}>
        <button
          className={`w-full px-3 py-1.5 text-xs ${tw.text.secondary} ${tw.hover} rounded-md transition-colors`}
          onClick={handleClearCompleted}
        >
          {t('clearCompleted')}
        </button>
      </div>
    </div>
  )
})
