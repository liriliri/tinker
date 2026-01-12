import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Search, X, CheckCircle2 } from 'lucide-react'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import AddTodo from './components/AddTodo'
import TodoItem from './components/TodoItem'

export default observer(function App() {
  const { t } = useTranslation()

  const currentCategoryName = {
    all: t('all'),
    today: t('today'),
    important: t('important'),
    completed: t('completed'),
  }[store.currentFilter]

  return (
    <AlertProvider>
      <div className={`h-screen flex ${tw.bg.primary}`}>
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <div
            className={`h-14 ${tw.bg.secondary} ${tw.border.bottom} flex items-center px-4 gap-3 flex-shrink-0`}
          >
            <h2 className={`text-base font-semibold ${tw.text.primary}`}>
              {currentCategoryName}
            </h2>

            <div className="flex-1"></div>

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
                className={`w-full h-8 pl-8 pr-8 ${tw.bg.input} border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring`}
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

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={store.showCompleted}
                onChange={(e) => store.setShowCompleted(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
              />
              <span className={`text-xs ${tw.text.secondary}`}>
                {t('showCompleted')}
              </span>
            </label>
          </div>

          <AddTodo />

          <div className="flex-1 overflow-y-auto p-4">
            {store.filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2
                  size={48}
                  className={`mx-auto ${tw.text.secondary} opacity-30 mb-3`}
                />
                <p className={`text-sm ${tw.text.secondary}`}>
                  {store.searchQuery ? t('noSearchResults') : t('noTasks')}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {store.filteredTodos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AlertProvider>
  )
})
