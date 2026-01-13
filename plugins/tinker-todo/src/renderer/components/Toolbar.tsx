import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Toolbar, ToolbarSpacer } from 'share/components/Toolbar'
import Checkbox from 'share/components/Checkbox'
import { tw } from 'share/theme'
import store from '../store'

export default observer(function ToolbarComponent() {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <h2 className={`text-base font-semibold ${tw.text.primary} ml-1`}>
        {
          {
            all: t('all'),
            today: t('today'),
            important: t('important'),
            completed: t('completed'),
          }[store.currentFilter]
        }
      </h2>

      <ToolbarSpacer />

      <div className="relative w-56">
        <Search
          size={14}
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${tw.text.secondary}`}
        />
        <input
          type="text"
          value={store.searchQuery}
          onChange={(e) => store.setSearchQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className={`w-full h-7 pl-8 pr-8 ${tw.bg.input} border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring`}
        />
        {store.searchQuery && (
          <button
            onClick={() => store.setSearchQuery('')}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${tw.text.secondary} hover:${tw.text.primary}`}
          >
            <X size={14} />
          </button>
        )}
      </div>

      <Checkbox
        checked={store.showCompleted}
        onChange={(checked) => store.setShowCompleted(checked)}
        className="mr-1"
      >
        <span className={tw.text.secondary}>{t('showCompleted')}</span>
      </Checkbox>
    </Toolbar>
  )
})
