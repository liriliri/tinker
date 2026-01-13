import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { AlertProvider } from 'share/components/Alert'
import { tw } from 'share/theme'
import store from './store'
import Sidebar from './components/Sidebar'
import AddTodo from './components/AddTodo'
import TodoItem from './components/TodoItem'
import Welcome from './components/Welcome'
import Toolbar from './components/Toolbar'

export default observer(function App() {
  const { t } = useTranslation()

  if (store.needsFileSelection) {
    return (
      <AlertProvider>
        <Welcome
          onOpenFile={() => store.openExistingFile()}
          onCreateFile={() => store.createNewFile()}
        />
      </AlertProvider>
    )
  }

  return (
    <AlertProvider>
      <div className={`h-screen flex ${tw.bg.primary}`}>
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Toolbar />

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
